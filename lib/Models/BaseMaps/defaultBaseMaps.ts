import Terria from "../Terria";

export function defaultBaseMaps(terria: Terria): any[] {
  const baseMaps: any[] = [];

  if (
    terria.configParameters.bingMapsKey &&
    terria.configParameters.useCesiumIonBingImagery !== true
  ) {
    baseMaps.push({
      item: {
        id: "basemap-bing-aerial-with-labels",
        name: "Bing Maps Aerial with Labels",
        type: "bing-maps",
        mapStyle: "AerialWithLabelsOnDemand",
        opacity: 1.0
      },
      image: "images/basemaps/bing-aerial-labels.png"
    });

    baseMaps.push({
      item: {
        id: "basemap-bing-aerial",
        name: "Bing Maps Aerial",
        type: "bing-maps",
        mapStyle: "Aerial",
        opacity: 1.0
      },
      image: "images/basemaps/bing-aerial.png"
    });
    baseMaps.push({
      item: {
        id: "basemap-bing-roads",
        name: "Bing Maps Roads",
        type: "bing-maps",
        mapStyle: "RoadOnDemand",
        opacity: 1.0
      },
      image: "images/basemaps/bing-maps-roads.png"
    });
  } else if (terria.configParameters.useCesiumIonBingImagery !== false) {
    baseMaps.push({
      item: {
        id: "basemap-bing-aerial-with-labels",
        name: "Bing Maps Aerial with Labels",
        type: "ion-imagery",
        ionAssetId: 3,
        opacity: 1.0
      },
      image: "images/basemaps/bing-aerial-labels.png"
    });

    baseMaps.push({
      item: {
        id: "basemap-bing-aerial",
        name: "Bing Maps Aerial",
        type: "ion-imagery",
        ionAssetId: 2,
        opacity: 1.0
      },
      image: "images/basemaps/bing-aerial.png"
    });
    baseMaps.push({
      item: {
        id: "basemap-bing-roads",
        name: "Bing Maps Roads",
        type: "ion-imagery",
        ionAssetId: 4,
        opacity: 1.0
      },
      image: "images/basemaps/bing-maps-roads.png"
    });
  }

  baseMaps.push({
    item: {
      id: "basemap-natural-earth-II",
      name: "Natural Earth II",
      type: "wms",
      url:
        "http://geoserver.nationalmap.nicta.com.au/imagery/natural-earth-ii/wms",
      layers: "NE2_HR_LC_SR_W_DR",
      opacity: 1.0
    },
    image: "images/basemaps/natural-earth.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-black-marble",
      name: "NASA Black Marble",
      type: "wms",
      url:
        "http://geoserver.nationalmap.nicta.com.au/imagery/nasa-black-marble/wms",
      layers: "nasa-black-marble:dnb_land_ocean_ice.2012.54000x27000_geo",
      opacity: 1.0
    },
    image: "images/basemaps/black-marble.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-positron",
      name: "Positron (Light)",
      type: "open-street-map",
      url: "https://basemaps.cartocdn.com/light_all/",
      attribution:
        "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
      subdomains: ["a", "b", "c", "d"],
      opacity: 1.0
    },
    image: "images/basemaps/positron.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-darkmatter",
      name: "Dark Matter",
      type: "open-street-map",
      url: "https://basemaps.cartocdn.com/dark_all/",
      attribution:
        "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
      subdomains: ["a", "b", "c", "d"],
      opacity: 1.0
    },
    image: "images/basemaps/dark-matter.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-here-terrain",
      name: "Here Terrain",
      type: "open-street-map",
      url: "https://aerial.maps.api.here.com/maptile/2.1/maptile/newest/terrain.day/{z}/{x}/{y}/256/png8?app_id=iXpRWOfbCuAG3RwT3ItP&app_code=ZLUrS2G28mo2mE-BCIFZmw",
      attribution: "HERE Maps",
      subdomains: ["1"],
      opacity: 1.0
    },
    image: "images/basemaps/HERE-TerrainDay.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-here-satellite",
      name: "HERE Satellite",
      type: "open-street-map",
      url: "https://aerial.maps.api.here.com/maptile/2.1/maptile/newest/terrain.day/{z}/{x}/{y}/256/png8?app_id=iXpRWOfbCuAG3RwT3ItP&app_code=ZLUrS2G28mo2mE-BCIFZmw",
      attribution: "HERE Maps",
      subdomains: ["2"],
      opacity: 1.0
    },
    image: "images/basemaps/HERE_SatelliteDay.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-thunderforest-outdoors",
      name: "Thunderforest Outdoors",
      type: "open-street-map",
      url: "https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=7644dc7df2924741a4f39bb88ee89576",
      attribution: "Thunderforest and OSM",
      opacity: 1.0
    },
    image: "images/basemaps/thunderforest_outdoors.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-thunderforest-transport-dark",
      name: "Thunderforest Transport Dark",
      type: "open-street-map",
      url: "https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png?apikey=7644dc7df2924741a4f39bb88ee89576",
      attribution: "Thunderforest and OSM",
      opacity: 1.0
    },
    image: "images/basemaps/thunderforest_transport_dark.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-esri-world-imagery-basemap",
      name: "ESRI World Imagery Basemap",
      type: "esri-mapServer",
      url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/",
      attribution: "ESRI World Imagery Basemap",
      opacity: 1.0
    },
    image: "images/basemaps/esri_worldimagery_basemap.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-esri-shaded-relief",
      name: "ESRI Shaded Relief Basemap",
      type: "esri-mapServer",
      url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/",
      attribution: "ESRI Shaded Relief Basemap",
      opacity: 1.0
    },
    image: "images/basemaps/esri_worldshadedrelief_basemap.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-esri-world-street-map",
      name: "ESRI World Street Map Basemap",
      type: "esri-mapServer",
      url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/",
      attribution: "ESRI World Street Map Basemap",
      opacity: 1.0
    },
    image: "images/basemaps/esri_World_Street_Map_basemap.png"
  });

  baseMaps.push({
    item: {
      id: "basemap-esri-natGeo-world-map",
      name: "ESRI NatGeo World Map Basemap",
      type: "esri-mapServer",
      url: "http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/",
      attribution: "ESRI NatGeo World Map Basemap",
      opacity: 1.0
    },
    image: "images/basemaps/esri_NationalGeographic_basemap.png"
  });

  return baseMaps;
}
