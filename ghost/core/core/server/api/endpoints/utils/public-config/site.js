const ghostVersion = require('@tryghost/version');
const settingsCache = require('../../../../../shared/settings-cache');
const urlUtils = require('../../../../../shared/url-utils').default;

module.exports = function getSiteProperties() {
  const siteProperties = {
    title: settingsCache.get('title'),
    description: settingsCache.get('description'),
    logo: settingsCache.get('logo'),
    icon: settingsCache.get('icon'),
    cover_image: settingsCache.get('cover_image'),
    accent_color: settingsCache.get('accent_color'),
    locale: settingsCache.get('locale'),
    timezone: settingsCache.get('timezone'),
    url: urlUtils.urlFor('home', true),
    version: ghostVersion.safe,
    site_uuid: settingsCache.get('site_uuid'),
  };

  return siteProperties;
};
