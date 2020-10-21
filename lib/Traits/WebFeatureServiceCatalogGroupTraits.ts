import CatalogMemberTraits from "./CatalogMemberTraits";
import GetCapabilitiesTraits from "./GetCapabilitiesTraits";
import GroupTraits from "./GroupTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";

export default class WebFeatureServiceCatalogGroupTraits extends mixTraits(
  GetCapabilitiesTraits,
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits
) {}
