import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import defined from "terriajs-cesium/Source/Core/defined";
import SearchProvider from "../Models/SearchProvider";
import Terria from "../Models/Terria";
import SearchProviderResults from "../Models/SearchProviderResults";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import i18next from "i18next";
import { observable, runInAction } from "mobx";
import { Cartesian2, Ellipsoid } from "terriajs-cesium";
import Resource from "terriajs-cesium/Source/Core/Resource";
import loadJsonp from "../Core/loadJsonp";
import SearchResult from "../Models/SearchResult";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import BingMapsSearchProvider from "../Models/BingMapsSearchProvider";

interface NominatimSearchOption {
  terria: Terria;
  countryCodes?: string;
  url?: string;
  flightDurationSeconds?: number;
}

export default class NominatimSearchProviderViewModel extends SearchProvider {
  readonly terria: Terria;
  @observable url: string;
  @observable countryCodes: string;
  @observable _geocodeInProgress? = {
    cancel: false
  };
  @observable flightDurationSeconds = 1.5;
  @observable limitBounded = 2;
  @observable limitOthers = 2;
  @observable primaryCountry?: string;

  constructor(options: NominatimSearchOption) {
    super();

    this.terria = options.terria;
    this.countryCodes = defined(options.countryCodes)
      ? "&countrycodes=" + options.countryCodes
      : "";

    this.name = "Nominatim";
    this.url = defaultValue(options.url, "//nominatim.openstreetmap.org/");
    if (this.url.length > 0 && this.url[this.url.length - 1] !== "/") {
      this.url += "/";
    }
    this.flightDurationSeconds = defaultValue(
      options.flightDurationSeconds,
      1.5
    );
    this.limitBounded = 2;
    this.limitOthers = 2;
  }

  protected doSearch(
    searchText: string,
    searchResults: SearchProviderResults
  ): Promise<void> {
    searchResults.results.length = 0;
    searchResults.message = undefined;

    this.terria.analytics.logEvent("search", "nominatim", searchText);

    // If there is already a search in progress, cancel it.
    if (defined(this._geocodeInProgress)) {
      // @ts-ignore
      this._geocodeInProgress.cancel = true;
      this._geocodeInProgress = undefined;
    }

    var bboxStr = "";

    if (defined(this.terria.cesium)) {
      // @ts-ignore
      var viewer = this.terria.cesium.viewer;
      var posUL = viewer.camera.pickEllipsoid(
        new Cartesian2(0, 0),
        Ellipsoid.WGS84
      );
      var posLR = viewer.camera.pickEllipsoid(
        new Cartesian2(viewer.canvas.width, viewer.canvas.height),
        Ellipsoid.WGS84
      );
      if (defined(posUL) && defined(posLR)) {
        posUL = Ellipsoid.WGS84.cartesianToCartographic(posUL);
        posLR = Ellipsoid.WGS84.cartesianToCartographic(posLR);
        bboxStr =
          "&viewbox=" +
          CesiumMath.toDegrees(posUL.longitude) +
          "," +
          CesiumMath.toDegrees(posUL.latitude) +
          "," +
          CesiumMath.toDegrees(posLR.longitude) +
          "," +
          CesiumMath.toDegrees(posLR.latitude);
      } else {
        bboxStr = "";
      }
    } else if (defined(this.terria.leaflet)) {
      // @ts-ignore
      var bbox = this.terria.leaflet.map.getBounds();
      bboxStr =
        "&viewbox=" +
        bbox.getWest() +
        "," +
        bbox.getNorth() +
        "," +
        bbox.getEast() +
        "," +
        bbox.getSouth();
    }

    const promise: Promise<any> = loadJsonp(
      new Resource({
        url:
          this.url +
          "search?q=" +
          searchText +
          bboxStr +
          "&bounded=1&format=json" +
          this.countryCodes +
          "&limit=" +
          this.limitBounded,
        queryParameters: {}
      }),
      "jsonp"
    );

    /*var promiseOthers = loadJson(
            this.url +
            "search?q=" +
            searchText +
            "&format=json" +
            this.countryCodes +
            "&limit=" +
            this.limitOthers
        );*/

    var that = this;
    var geocodeInProgress = (this._geocodeInProgress = {
      cancel: false
    });

    return promise.then(result => {
      if (searchResults.isCanceled) {
        // A new search has superseded this one, so ignore the result.
        return;
      }

      if (result.resourceSets.length === 0) {
        searchResults.message = i18next.t("viewModels.searchNoLocations");
        return;
      }

      var resourceSet = result.resourceSets[0];
      if (resourceSet.resources.length === 0) {
        searchResults.message = i18next.t("viewModels.searchNoLocations");
        return;
      }

      const primaryCountryLocations: any[] = [];
      const otherLocations: any[] = [];

      for (let i = 0; i < resourceSet.resources.length; ++i) {
        const resource = resourceSet.resources[i];

        let name = resource.name;
        if (!defined(name)) {
          continue;
        }

        let list = primaryCountryLocations;
        let isImportant = true;

        const country = resource.address
          ? resource.address.countryRegion
          : undefined;
        if (defined(this.primaryCountry) && country !== this.primaryCountry) {
          // Add this location to the list of other locations.
          list = otherLocations;
          isImportant = false;

          // Add the country to the name, if it's not already there.
          if (
            defined(country) &&
            name.lastIndexOf(country) !== name.length - country.length
          ) {
            name += ", " + country;
          }
        }

        list.push(
          new SearchResult({
            name: name,
            isImportant: isImportant,
            clickAction: createZoomToFunction(this, resource),
            location: {
              latitude: resource.point.coordinates[0],
              longitude: resource.point.coordinates[1]
            }
          })
        );
      }

      runInAction(() => {
        searchResults.results.push(...primaryCountryLocations);
        searchResults.results.push(...otherLocations);
      });

      if (searchResults.results.length === 0) {
        searchResults.message = i18next.t("viewModels.searchNoLocations");
      }
    });

    /*return when
            .all([promiseBounded, promiseOthers])
            .then(function(result) {
                if (geocodeInProgress.cancel) {
                    return;
                }
                that.isSearching = false;

                if (result.length === 0) {
                    return;
                }

                var locations = [];

                // Locations in the bounded query go on top, locations elsewhere go undernearth
                var findDbl = function(elts, id) {
                    return elts.filter(function(elt) {
                        return elt.id === id;
                    })[0];
                };

                for (var i = 0; i < result.length; ++i) {
                    for (var j = 0; j < result[i].length; ++j) {
                        var resource = result[i][j];

                        var name = resource.display_name;
                        if (!defined(name)) {
                            continue;
                        }

                        if (!findDbl(locations, resource.place_id)) {
                            locations.push(
                                new SearchResultViewModel({
                                    id: resource.place_id,
                                    name: name,
                                    isImportant: true,
                                    clickAction: createZoomToFunction(that, resource)
                                })
                            );
                        }
                    }
                }

                that.searchResults.push.apply(that.searchResults, locations);

                if (that.searchResults.length === 0) {
                    that.searchMessage = i18next.t("viewModels.searchNoLocations");
                }
            })
            .otherwise(function() {
                if (geocodeInProgress.cancel) {
                    return;
                }

                that.isSearching = false;
                that.searchMessage = i18next.t("viewModels.searchErrorOccurred");
            });*/
  }
}

function createZoomToFunction(
  model: NominatimSearchProviderViewModel,
  resource: any
) {
  const [south, west, north, east] = resource.bbox;
  const rectangle = Rectangle.fromDegrees(west, south, east, north);

  return function() {
    const terria = model.terria;
    terria.currentViewer.zoomTo(rectangle, model.flightDurationSeconds);
  };
}
