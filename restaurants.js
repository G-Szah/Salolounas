// Salon ravintolat. type 'lounasopas' = haetaan LounasOpas.com:in
// yksittäiseltä ravintolasivulta (jossa tämän päivän kohta on merkitty
// "(Tänään)"). type 'kastu' / 'factory' / 'teijun' = haetaan suoraan
// ravintolan omalta kotisivulta.

const RESTAURANTS = [
  { name: 'ABC Piihovi Salo Restaurant', address: 'Ruoksmäentie 1, 24260 Salo',
    url: 'https://lounasopas.com/restaurant/abc-piihovi-salo-restaurant-salo-ruoksmaentie-1-24260-salo',
    website: 'https://www.abcasemat.fi/asemat/abc-piihovi-salo-542871546/noutopoyta-lounas', type: 'lounasopas' },

  { name: 'Dreamravintola', address: 'Savenvalajankatu 3, 24260 Salo',
    url: 'https://lounasopas.com/restaurant/dreamravintola-salo',
    website: 'https://www.dreamravintola.fi/', type: 'lounasopas' },

  { name: 'Factory Salo IoT Campus', address: 'Joensuunkatu 7, 24100 Salo',
    url: 'https://ravintolafactory.com/lounasravintolat/ravintolat/factory-salo/',
    website: 'https://ravintolafactory.com/lounasravintolat/ravintolat/factory-salo/', type: 'factory' },

  { name: 'Kastu', address: 'Helsingintie 3, 24100 Salo',
    url: 'https://ravintolakastu.fi/lounas/',
    website: 'https://ravintolakastu.fi/', type: 'kastu' },

  { name: 'Kespa', address: 'Koskikatu 1, 24240 Salo',
    url: 'https://lounasopas.com/restaurant/kespa-salo-koskikatu-1-24240-salo',
    website: 'https://www.kespa.fi/', type: 'lounasopas' },

  { name: 'KhaoSuk', address: 'Helsingintie 8, 24100 Salo',
    url: 'https://lounasopas.com/restaurant/khaosuk-salo',
    website: 'https://www.khaosuk.com/', type: 'lounasopas' },

  { name: 'Liikenneasema Kivihovi', address: 'Bulevardi 10, 25410 Suomusjärvi',
    url: 'https://lounasopas.com/restaurant/liikenneasema-kivihovi-salo-salo',
    website: 'https://kivihovi.fi/lounas', type: 'lounasopas' },

  { name: 'Lounasravintola Rosmariini', address: 'Joensuunkatu 13, 24100 Salo',
    url: 'https://lounasopas.com/restaurant/lounasravintola-rosmariini-salo',
    website: 'https://pitopalvelurosmariini.fi/', type: 'lounasopas' },

  { name: "Ravintola Mama's", address: 'Salorankatu 5-7, 24240 Salo',
    url: 'https://lounasopas.com/restaurant/ravintola-mama-s-salo-salorankatu-5-7-salo',
    website: 'https://www.ravintolamamas.fi/', type: 'lounasopas' },

  { name: 'Rikalan krouvi', address: 'Rikalantie 74, 24800 Halikko, Salo',
    url: 'https://lounasopas.com/restaurant/rikalan-krouvi-salo-rikalantie-74-salo',
    website: 'https://rikalankrouvi.fi/lounas/', type: 'lounasopas' },

  { name: 'Shell HelmiSimpukka Salo Halikko', address: 'Vaskiontie 420, 24800 Salo',
    url: 'https://lounasopas.com/restaurant/shell-helmisimpukka-salo-halikko-salo',
    website: 'https://helmisimpukka.fi/asemat/salo-halikko', type: 'lounasopas' },

  { name: 'Teijun Keittiö', address: 'Turuntie 35, 24100 Salo',
    url: 'https://www.teijunkeittio.fi/',
    website: 'https://www.teijunkeittio.fi/', type: 'teijun' },

  { name: 'Wiurilan kartanoravintola', address: 'Viurilantie 126, 24910 Salo',
    url: 'https://lounasopas.com/restaurant/wiurilan-kartanoravintola-salo-salo',
    website: 'https://wiurilansigrid.fi/lounas/', type: 'lounasopas' },

  { name: 'Antonio Salo', address: 'Vilhonkatu 8, 24100 Salo',
    url: 'https://lounasopas.com/restaurant/antonio-salo-salo',
    website: 'https://www.raflaamo.fi/fi/ravintola/salo/antonio-salo/menu/lounas', type: 'lounasopas' },
];
