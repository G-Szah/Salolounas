// Automaattisesti päivittyvä varmuuskopio LounasOpas.com:in datasta.
// Käytetään vain jos live-haku epäonnistuu (esim. proxy pois pelistä).
const SNAPSHOT_DATE = '2026-08-26';
const FALLBACK_RESTAURANTS = [
  {
    "name": "ABC Piihovi Salo Restaurant",
    "address": "Ruoksmäentie 1, 24260 Salo",
    "items": [
      {"text": "Pizzapöytä sis. 5 eri pizzaa", "price": "14,90 €"},
      {"text": "Jauhelihamureketta sienikastikkeessa", "price": "14,90 €"},
      {"text": "Puolukkahilloa", "price": "14,90 €"},
      {"text": "Mac'n'cheese & chicken", "price": "14,90 €"},
      {"text": "Kasvisbolognesea italialaiseen tapaan", "price": "14,90 €"},
      {"text": "Rapeita wokkikasviksia", "price": "14,90 €"},
      {"text": "Perunamuusia", "price": "14,90 €"}
    ]
  },
  {"name": "Cafe Shop Nixor", "address": "Niksaarentie 340, Salo", "items": [{"text": "Liharagotta ja kasviksia", "price": "11,00 €"}]},
  {"name": "Dreamravintola", "address": "Savenvalajankatu 3, 24260 Salo", "items": [{"text": "Lounas (sisältää myös salaatin)", "price": "12,00 €"}]},
  {"name": "Factory Salo IOT Campus", "address": "Joensuunkatu 7, 24100 Salo", "items": [{"text": "Kotiruokabuffet: Tomaattinen rapukeitto (L+G) + Paneroitua kanan sisäfilettä (M) + ranch-maustetut uunilohkoperunat (VE+G+VS) + Tofu Tikka Masala (VE+G+VS) + Aurinkokiisseli (VE+G) + minttuvaahto (L+G", "price": "13,70 €"}]},
  {"name": "Kahvila Wilhelmiina", "address": "Vilhonkatu 6, 24100 Salo", "items": [{"text": "Salad lunch with dressing and crackered bread", "price": "11,50 €"}]},
  {"name": "Kastu", "address": "Helsingintie 3, 24100 Salo, Finland", "items": [
      {"text": "Buffet lounas", "price": "13,70 €"},
      {"text": "Keittolounas", "price": "12,50 €"},
      {"text": "Salaattibowl (kana/halloum/tofu)", "price": "17,50 €"}
    ]},
  {"name": "Kespa", "address": "Koskikatu 1, 24240 Salo", "items": [
      {"text": "Paistettu kampela", "price": "13,50 €"},
      {"text": "Jauhelihakastike", "price": "13,50 €"},
      {"text": "Lihakeitto", "price": "13,50 €"},
      {"text": "Omenakaurapaistos", "price": "13,50 €"}
    ]},
  {"name": "KhaoSuk", "address": "Helsingintie 8, 24100 Salo", "items": [{"text": "Friteerattua kanaa, ruskea kanakastike riisinuudeleilla", "price": "13,50 €"}]},
  {"name": "Kotipizza", "address": "24100 Salo", "items": [
      {"text": "Lounaskombo 13,90 € (M-kokoinen pizza / Kotzone / Rulla / Salaatti + 0,33 l juomaa)", "price": "13,90 €"},
      {"text": "Monster + dippi + juoma 15,90 €", "price": "15,90 €"}
    ]},
  {"name": "Liikenneasema Kivihovi", "address": "Bulevardi 10, 25410 Suomusjärvi", "items": [{"text": "Rapea kalapala, remouladekastiketta", "price": "14,00 €"}]},
  {"name": "Lounasravintola Rosmariini", "address": "Joensuunkatu 13, 24100 Salo", "items": [
      {"text": "Kermainen lohikeitto (L,G)", "price": "11,00 €"},
      {"text": "Ylikypsää BBQ-possua (M,G), paistetut perunat (M,L,G,VE)", "price": "14,50 €"},
      {"text": "Broileri burgundin tapaan (L,G), riisi (M,L,G,VE)", "price": "14,50 €"},
      {"text": "Pinaattilettuja ja puolukkahilloa (L)", "price": "12,50 €"},
      {"text": "Marjapiirakkaa ja vaniljakastike (L)", "price": "5,50 €"}
    ]},
  {"name": "MaittavaMenu", "address": "Muurlantie 9, Muurla", "items": [{"text": "Kasvis-sosekeitto", "price": "11,90 €"}]},
  {"name": "Matildankartano", "address": "Bremerintie 4, 25660 Mathildedal", "items": [{"text": "Kasvispyttipannu", "price": "11,50 €"}]},
  {"name": "Muurla", "address": "Aleksanterinkatu 10, Salo", "items": [
      {"text": "Tomaattinen rapukeitto", "price": "10,00 €"},
      {"text": "Paneroitua kanan sisäfileetä", "price": "14,00 €"},
      {"text": "Yön yli haudutettua porsaan kassleria", "price": "15,00 €"},
      {"text": "Tofua Tikka Masala", "price": "13,00 €"},
      {"text": "Aurinkokiisseli minttuvaahto", "price": "5,50 €"}
    ]},
  {"name": "Puistos", "address": "Anistenkatu 1, 24100 Salo", "items": [
      {"text": "Juustoinen kesäkurpitsakeitto", "price": "11,50 €"},
      {"text": "Kanttarellirisotto", "price": "14,00 €"},
      {"text": "Wieninleike", "price": "14,00 €"},
      {"text": "Kreikkalainen broilerigyros ja tsatsikia", "price": "14,00 €"},
      {"text": "Pieni makea", "price": "11,50 €"}
    ]},
  {"name": "Ravintola Kanari", "address": "Helsingintie 10, 24100 Salo", "items": [{"text": "Lounasbuffet – päivän pääruoka ja lisukkeet", "price": "11,90 €"}]},
  {"name": "Ravintola Mama's", "address": "Salorankatu 5-7, Salo", "items": [
      {"text": "Lounas", "price": "11,50 €"},
      {"text": "Keittolounas", "price": "9,50 €"},
      {"text": "Salaattilounas", "price": "8,50 €"}
    ]},
  {"name": "Riikin Baari", "address": "Riikinkuja 1, Salo", "items": [{"text": "Grillattua kanaa", "price": "11,90 €"}]},
  {"name": "Rikalan krouvi", "address": "Rikalantie 74, 24800 Halikko, Salo", "items": [
      {"text": "Punajuuri-fetasalaattia ja balsamicokastiketta", "price": "14,00 €"},
      {"text": "Kermaista kanapastaa ja aurinkokuivattua tomaattia", "price": "16,50 €"},
      {"text": "Paahdettua lohta, perunamuhennosta ja kermaviilikastiketta", "price": "18,00 €"},
      {"text": "Kuningatarpavlova", "price": "5,00 €"}
    ]},
  {"name": "Shell HelmiSimpukka Salo Halikko", "address": "Vaskiontie 420, 24800 Salo", "items": [
      {"text": "Kylmäsavulohikiusaus", "price": "14,00 €"},
      {"text": "Helmen pannupihvejä ja pekoni-sipulikastiketta", "price": "14,00 €"},
      {"text": "Espanjalaista chorizokeittoa", "price": "10,90 €"},
      {"text": "Sipulipihvi possun ulkofileestä lautasannos", "price": "16,50 €"}
    ]},
  {"name": "Sushi House Salo", "address": "Turuntie 15, 24240 Salo", "items": [{"text": "Salmon avocado roll", "price": "13,50 €"}]},
  {"name": "Taukopaikka Lahnajärvi", "address": "Helsingintie 3276, 25420 Lahnajärvi", "items": [{"text": "WIENINLEIKE", "price": "11,50 €"}]},
  {"name": "Teijun Keittiö", "address": "Turuntie 35, Salo", "items": [
      {"text": "Porsaan grillipihvit", "price": "12,70 €"},
      {"text": "Paholasien kanapasta", "price": "12,70 €"},
      {"text": "Nakkikeitto", "price": "12,70 €"},
      {"text": "Hedelmäsalaatti", "price": "12,70 €"}
    ]},
  {"name": "Wiurilan kartanoravintola", "address": "Viurilantie 126, 24910 Salo", "items": [
      {"text": "Keittolounas", "price": "12,00 €"},
      {"text": "Lihapullat ja perunamuhennos", "price": "14,50 €"},
      {"text": "Tyrnirahka", "price": "14,50 €"}
    ]}
];
