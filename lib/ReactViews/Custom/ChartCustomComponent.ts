import { DomElement } from "domhandler";
import { runInAction } from "mobx";
import React, { ReactElement } from "react";
import DeveloperError from "terriajs-cesium/Source/Core/DeveloperError";
import filterOutUndefined from "../../Core/filterOutUndefined";
import CommonStrata from "../../Models/CommonStrata";
import ChartPreviewStyles from "./Chart/chart-preview.scss";
import ChartExpandAndDownloadButtons from "./Chart/ChartExpandAndDownloadButtons";
import Chart from "./Chart/FeatureInfoPanelChart";
import CustomComponent, { ProcessNodeContext } from "./CustomComponent";
import Model, { BaseModel } from "../../Models/Model";
import CatalogMemberTraits from "../../Traits/CatalogMemberTraits";
import hasTraits from "../../Models/hasTraits";
import SplitItemReference from "../../Models/SplitItemReference";
import createGuid from "terriajs-cesium/Source/Core/createGuid";
import DiscretelyTimeVaryingTraits from "../../Traits/DiscretelyTimeVaryingTraits";

export interface ChartCustomComponentAttributes {
  /**  The title of the chart.  If not supplied, defaults to the name of the context-supplied feature, if available, or else simply "Chart". */
  title?: string;

  /** An id for the chart; give different charts from the same feature different ids. The actual catalogItem.id used for the expanded chart will also incorporate the chart title and the catalog item name it came from. */
  identifier?: string;

  /** 'true' to hide the Expand and Download buttons on the chart.  By default and for any other value, the buttons are shown when applicable.
   * Overrides can-download. */
  hideButtons?: boolean;

  /** Comma-separated URLs for data at each available time range. The first in the list is shown in the feature info panel preview.
   * Eg. `sources="http://example.com/series?offset=1d,http://example.com/series?offset=5d,http://example.com/series?all"`*/
  sources?: string[];

  /** Comma-separated display names for each available time range, used in the expand-chart dropdown button.
   * Eg. `source-names="1d,5d,30d"`. */
  sourceNames?: string[];

  /** 'false' to hide the Download button on the chart.  By default true and for any other value, the download button is shown. */
  canDownload?: boolean;

  /** Same as sources, but for download only. Defaults to the same as sources.
   *  Eg. `sources="http://example.com/series?offset=1d,http://example.com/series?offset=5d,http://example.com/series?all"` */
  downloads?: string[];

  /** Same as source-names, but for download only. Defaults to the same as source-names.
   *  Eg. `source-names="1d,5d,30d,max"`. */
  downloadNames?: string[];

  /** Defaults to 'feature-info'. Can also be 'histogram'. TODO: improve. */
  styling?: string;

  /** Maps column names to titles. Eg. column-names="time:Time,height:Height,speed:Speed" */
  columnTitles?: { name: string; title: string }[];

  /** Maps column names to units. Eg. column-units="height:m,speed:km/h" */
  columnUnits?: { name: string; units: string }[];

  /** The x column name or number to show in the preview, if not the first appropriate column. NOT FULLY IMPLEMENTED YET. */
  xColumn?: string;

  /** The y column name or number to show in the preview, if not the first scalar column. */
  yColumn?: string;

  /** Comma-separated list of y column names or numbers to show in the preview. Overrides "y-column" if provided. */
  yColumns?: string[];

  /** The preview chart x-axis label. Defaults to empty string. Eg. long-names="Last 24 hours,Last 5 days,Time". */
  previewXLabel?: string;

  /** An x-coordinate to highlight. */
  highlightX?: string;

  /** The URL of the data to show in the chart panel, once "expand" is clicked. Eg. `src="http://example.com/full_time_series.csv"`. */
  src?: string;

  /** The URL of the data to show in the feature info panel. Defaults to src. Eg. `src-preview="http://example.com/preview_time_series.csv"`. */
  srcPreview?: string;

  /** csv-formatted data, with \n for newlines. Eg. data="time,a,b\n2016-01-01,2,3\n2016-01-02,5,6".
   * or json-formatted string data, with \quot; for quotes, eg. `data="[[\quot;a\quot;,\quot;b\quot;],[2,3],[5,6]]"`. */
  data?: string;
}

/**
 * A chart custom component. It displays an interactive chart along with
 * "expand" and "download" buttons. The expand button adds a catalog item with
 * the data to the workbench, causing it to be displayed on the Chart Panel.
 * The chart detects if it appears in the second column of a <table> and, if so,
 * rearranges itself to span two columns.
 *
 * See {see ChartCustomComponentAttributes} for a full list of attributes.
 *
 * Provide the data in one of these four ways:
 * - [sources]:        {see ChartCustomComponentAttributes.sources}
 * - [source-names]:   {see ChartCustomComponentAttributes.sourceNames}
 * - [downloads]:      {see ChartCustomComponentAttributes.downloads}
 * - [download-names]: {see ChartCustomComponentAttributes.downloadNames}
 * Or:
 * - [src]:          {see ChartCustomComponentAttributes.src}
 * - [src-preview]:  {see ChartCustomComponentAttributes.srcPreview}
 * Or:
 * - [data]:        {see ChartCustomComponentAttributes.data}
 * Or:
 * - None of the above, but supply csv or json-formatted data as the content of the chart data, with \n for newlines.
 *                   Eg. `<chart>time,a,b\n2016-01-01,2,3\n2016-01-02,5,6</chart>`.
 *                   or  `<chart>[["x","y","z"],[1,10,3],[2,15,9],[3,8,12],[5,25,4]]</chart>`.
 */

type CatalogMemberType = Model<CatalogMemberTraits>;
export default abstract class ChartCustomComponent<
  CatalogItemType extends CatalogMemberType
> extends CustomComponent {
  get attributes(): Array<string> {
    return [
      "src",
      "src-preview",
      "sources",
      "source-names",
      "downloads",
      "download-names",
      "preview-x-label",
      "data",
      "identifier",
      "x-column",
      "y-column",
      "y-columns",
      "column-titles",
      "column-units",
      "styling",
      "highlight-x",
      "title",
      "can-download",
      "hide-buttons"
    ];
  }

  abstract get name(): string;

  shouldProcessNode(context: ProcessNodeContext, node: DomElement): boolean {
    return (
      this.isChart(node) ||
      this.isFirstColumnOfChartRow(node) ||
      this.isSecondColumnOfChartRow(node)
    );
  }

  processNode(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined {
    if (this.isChart(node)) {
      return this.processChart(context, node, children, index);
    } else if (this.isFirstColumnOfChartRow(node)) {
      return this.processFirstColumn(context, node, children, index);
    } else if (this.isSecondColumnOfChartRow(node)) {
      return this.processSecondColumn(context, node, children, index);
    }
    throw new DeveloperError("processNode called unexpectedly.");
  }

  /**
   * Is this node the chart element itself?
   * @param node The node to test.
   */
  private isChart(node: DomElement): boolean {
    return node.name === this.name;
  }

  /**
   * Used to construct a new catalog item to form the basis of the chart.
   */
  protected abstract constructCatalogItem(
    id: string | undefined,
    context: ProcessNodeContext,
    sourceReference: BaseModel | undefined
  ): CatalogItemType;

  /**
   * For some catalog types, for the chart item to be shareable, it needs to be
   * constructed as a reference to the original item. This method can be
   * overriden to make a shareable chart. See SOSChartCustomComponent for an
   * implementation.
   *
   * This method is used only for constructing a chart item to show
   * in the chart panel, not for the feature info panel chart item.
   */
  protected constructShareableCatalogItem?: (
    id: string | undefined,
    context: ProcessNodeContext,
    sourceReference: BaseModel | undefined
  ) => Promise<CatalogItemType | undefined> = undefined;

  private processChart(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined {
    if (node.attribs === undefined) {
      return undefined;
    }

    checkAllPropertyKeys(node.attribs, this.attributes);

    const chartDisclaimer = (context.catalogItem as any).chartDisclaimer;

    const attrs = this.parseNodeAttrs(node.attribs);
    const child = children[0];
    const body: string | undefined =
      typeof child === "string" ? child : undefined;
    const chartElements = [];
    if (!attrs.hideButtons) {
      // Build expand/download buttons
      const sourceItems = (attrs.downloads || attrs.sources || [""]).map(
        (source: string, i: number) => {
          const id = [
            context.catalogItem.uniqueId,
            context.feature.id,
            source
          ].join(":");

          const itemOrPromise = this.constructShareableCatalogItem
            ? this.constructShareableCatalogItem(id, context, undefined)
            : this.constructCatalogItem(id, context, undefined);

          return Promise.resolve(itemOrPromise).then(item => {
            if (item) {
              this.setTraitsFromAttrs(item, attrs, i);
              body && this.setTraitsFromBody?.(item, body);
              if (
                hasTraits(
                  item,
                  DiscretelyTimeVaryingTraits,
                  "chartDisclaimer"
                ) &&
                chartDisclaimer !== undefined
              ) {
                item.setTrait(
                  CommonStrata.definition,
                  "chartDisclaimer",
                  chartDisclaimer
                );
              }
            }
            return item;
          });
        }
      );

      chartElements.push(
        React.createElement(ChartExpandAndDownloadButtons, {
          key: "button",
          terria: context.terria,
          sourceItems: sourceItems,
          sourceNames: attrs.sourceNames,
          canDownload: attrs.canDownload,
          downloads: attrs.downloads,
          downloadNames: attrs.downloadNames,
          raiseToTitle: !!getInsertedTitle(node)
        })
      );
    }

    // Build chart item to show in the info panel
    const chartItem = this.constructCatalogItem(undefined, context, undefined);
    runInAction(() => {
      this.setTraitsFromAttrs(chartItem, attrs, 0);
      body && this.setTraitsFromBody?.(chartItem, body);

      if (
        hasTraits(chartItem, DiscretelyTimeVaryingTraits, "chartDisclaimer") &&
        chartDisclaimer !== undefined
      ) {
        chartItem.setTrait(
          CommonStrata.definition,
          "chartDisclaimer",
          chartDisclaimer
        );
      }
    });

    chartElements.push(
      React.createElement(Chart, {
        key: "chart",
        terria: context.terria,
        item: chartItem,
        xAxisLabel: attrs.previewXLabel,
        height: 110
        // styling: attrs.styling,
        // highlightX: attrs.highlightX,
        // transitionDuration: 300
      })
    );

    return React.createElement(
      "div",
      {
        key: "chart-wrapper",
        className: ChartPreviewStyles.previewChartWrapper
      },
      chartElements
    );
  }

  /**
   * Populate the traits in the supplied catalog item with the values from the attributes of the component.
   * Assume it will be run in an action.
   * @param item
   * @param attrs
   * @param sourceIndex
   */
  protected abstract setTraitsFromAttrs(
    item: CatalogItemType,
    attrs: ChartCustomComponentAttributes,
    sourceIndex: number
  ): void;

  /**
   * Populate  traits in the supplied catalog item with the values from the body of the component.
   * Assume it will be run in an action.
   * @param item
   * @param attrs
   * @param sourceIndex
   */
  protected setTraitsFromBody?: (item: CatalogItemType, body: string) => void;

  /**
   * Is this node the first column of a two-column table where the second
   * column contains a `<chart>`?
   * @param node The node to test
   */
  private isFirstColumnOfChartRow(node: DomElement): boolean {
    return (
      node.name === "td" &&
      node.children !== undefined &&
      node.children.length === 1 &&
      node.parent !== undefined &&
      node.parent.name === "tr" &&
      node.parent.children !== undefined &&
      node.parent.children.length === 2 &&
      node === node.parent.children[0] &&
      node.parent.children[1].name === "td" &&
      node.parent.children[1].children !== undefined &&
      node.parent.children[1].children.length === 1 &&
      node.parent.children[1].children[0].name === "chart"
    );
  }

  private processFirstColumn(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined {
    // Do not return a node.
    return undefined;
  }

  /**
   * Is this node the second column of a two-column table where the second
   * column contains a `<chart>`?
   * @param node The node to test
   */
  private isSecondColumnOfChartRow(node: DomElement): boolean {
    return (
      node.name === "td" &&
      node.children !== undefined &&
      node.children.length === 1 &&
      node.children[0].name === "chart" &&
      node.parent !== undefined &&
      node.parent.name === "tr" &&
      node.parent.children !== undefined &&
      node.parent.children.length === 2
    );
  }

  private processSecondColumn(
    context: ProcessNodeContext,
    node: DomElement,
    children: ReactElement[],
    index: number
  ): ReactElement | undefined {
    const title = node.parent!.children![0].children![0].data;
    const revisedChildren: ReactElement[] = [
      React.createElement(
        "div",
        {
          key: "title",
          className: ChartPreviewStyles.chartTitleFromTable
        },
        title
      ) as ReactElement
    ].concat(children);
    return React.createElement(
      "td",
      { key: "chart", colSpan: 2, className: ChartPreviewStyles.chartTd },
      node.data,
      revisedChildren
    );
  }

  /**
   * Parse node attrs to an easier to process structure.
   */
  protected parseNodeAttrs(nodeAttrs: {
    [name: string]: string | undefined;
  }): ChartCustomComponentAttributes {
    let sources = splitStringIfDefined(nodeAttrs.sources);
    if (sources === undefined && nodeAttrs.src !== undefined) {
      // [src-preview, src], or [src] if src-preview is not defined.
      sources = [nodeAttrs.src];
      const srcPreview = nodeAttrs["src-preview"];
      if (srcPreview !== undefined) {
        sources.unshift(srcPreview);
      }
    }
    const sourceNames = splitStringIfDefined(nodeAttrs["source-names"]);
    const downloads = splitStringIfDefined(nodeAttrs.downloads) || sources;
    const downloadNames =
      splitStringIfDefined(nodeAttrs["download-names"]) || sourceNames;

    const columnTitles = filterOutUndefined(
      (nodeAttrs["column-titles"] || "").split(",").map(s => {
        const [name, title] = rsplit2(s, ":");
        return name ? { name, title } : undefined;
      })
    );

    const columnUnits = filterOutUndefined(
      (nodeAttrs["column-units"] || "").split(",").map(s => {
        const [name, units] = rsplit2(s, ":");
        return name ? { name, units } : undefined;
      })
    );

    const yColumns = splitStringIfDefined(
      nodeAttrs["y-columns"] || nodeAttrs["y-column"]
    );

    return {
      title: nodeAttrs["title"],
      identifier: nodeAttrs["identifier"],
      hideButtons: nodeAttrs["hide-buttons"] === "true",
      sources,
      sourceNames,
      canDownload: !(nodeAttrs["can-download"] === "false"),
      downloads,
      downloadNames,
      styling: nodeAttrs["styling"] || "feature-info",
      highlightX: nodeAttrs["highlight-x"],
      columnTitles,
      columnUnits,
      xColumn: nodeAttrs["x-column"],
      previewXLabel: nodeAttrs["preview-x-label"],
      yColumns
    };
  }

  /**
   * A helper method to create a shareable reference to an item.
   */
  async createItemReference(
    sourceItem: CatalogItemType
  ): Promise<CatalogItemType | undefined> {
    const terria = sourceItem.terria;
    const ref = new SplitItemReference(createGuid(), terria);
    ref.setTrait(CommonStrata.user, "splitSourceItemId", sourceItem.uniqueId);
    await ref.loadReference();
    if (ref.target) {
      terria.addModel(ref);
      return ref.target as CatalogItemType;
    }
  }
}

function checkAllPropertyKeys(object: any, allowedKeys: string[]) {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      if (allowedKeys.indexOf(key) === -1) {
        console.log("Unknown attribute " + key);
      }
    }
  }
}

export function splitStringIfDefined(s: string | undefined) {
  return s !== undefined ? s.split(",") : undefined;
}

/*
 * Split string `s` from last using `sep` into 2 pieces.
 */
function rsplit2(s: string, sep: string) {
  const pieces = s.split(sep);
  if (pieces.length === 1) {
    return pieces;
  } else {
    const head = pieces.slice(0, pieces.length - 1).join(sep);
    const last = pieces[pieces.length - 1];
    return [head, last];
  }
}

function getInsertedTitle(node: DomElement) {
  // Check if there is a title in the position 'Title' relative to node <chart>:
  // <tr><td>Title</td><td><chart></chart></tr>
  if (
    node.parent !== undefined &&
    node.parent.name === "td" &&
    node.parent.parent !== undefined &&
    node.parent.parent.name === "tr" &&
    node.parent.parent.children !== undefined &&
    node.parent.parent.children[0] !== undefined &&
    node.parent.parent.children[0].children !== undefined &&
    node.parent.parent.children[0].children[0] !== undefined
  ) {
    return node.parent.parent.children[0].children[0].data;
  }
}
