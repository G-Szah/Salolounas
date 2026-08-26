// Salon ravintolat, joilla on aidosti päiväkohtainen, rakenteinen
// lounaslista SUORAAN omalla kotisivullaan (ei aggregaattorilta).
// Loput Salon lounaspaikat karsittiin pois, koska niiden omat sivut
// eivät julkaise päiväkohtaisia annoksia rakenteisesti.

const RESTAURANTS = [
  {
    name: 'Kastu',
    address: 'Helsingintie 3, 24100 Salo',
    url: 'https://ravintolakastu.fi/lounas/',
    website: 'https://ravintolakastu.fi/',
    type: 'kastu',
  },
  {
    name: 'Factory Salo IoT Campus',
    address: 'Joensuunkatu 7, 24100 Salo',
    url: 'https://ravintolafactory.com/lounasravintolat/ravintolat/factory-salo/',
    website: 'https://ravintolafactory.com/lounasravintolat/ravintolat/factory-salo/',
    type: 'factory',
  },
  {
    name: 'Teijun Keittiö',
    address: 'Turuntie 35, 24100 Salo',
    url: 'https://www.teijunkeittio.fi/',
    website: 'https://www.teijunkeittio.fi/',
    type: 'teijun',
  },
];
