// German cities with their coordinates
export interface CityCoordinates {
  name: string;
  latitude: number;
  longitude: number;
}

export const GERMAN_CITIES: CityCoordinates[] = [
  { name: "Berlin", latitude: 52.5200, longitude: 13.4050 },
  { name: "Hamburg", latitude: 53.5511, longitude: 9.9937 },
  { name: "München", latitude: 48.1351, longitude: 11.5820 },
  { name: "Köln", latitude: 50.9375, longitude: 6.9603 },
  { name: "Frankfurt am Main", latitude: 50.1109, longitude: 8.6821 },
  { name: "Stuttgart", latitude: 48.7758, longitude: 9.1829 },
  { name: "Düsseldorf", latitude: 51.2277, longitude: 6.7735 },
  { name: "Leipzig", latitude: 51.3397, longitude: 12.3731 },
  { name: "Dortmund", latitude: 51.5136, longitude: 7.4653 },
  { name: "Essen", latitude: 51.4556, longitude: 7.0116 },
  { name: "Bremen", latitude: 53.0793, longitude: 8.8017 },
  { name: "Dresden", latitude: 51.0504, longitude: 13.7373 },
  { name: "Hannover", latitude: 52.3759, longitude: 9.7320 },
  { name: "Nürnberg", latitude: 49.4521, longitude: 11.0767 },
  { name: "Duisburg", latitude: 51.4344, longitude: 6.7623 },
  { name: "Bochum", latitude: 51.4818, longitude: 7.2162 },
  { name: "Wuppertal", latitude: 51.2562, longitude: 7.1508 },
  { name: "Bielefeld", latitude: 52.0302, longitude: 8.5325 },
  { name: "Bonn", latitude: 50.7374, longitude: 7.0982 },
  { name: "Münster", latitude: 51.9607, longitude: 7.6261 },
  { name: "Mannheim", latitude: 49.4875, longitude: 8.4660 },
  { name: "Karlsruhe", latitude: 49.0069, longitude: 8.4037 },
  { name: "Augsburg", latitude: 48.3705, longitude: 10.8978 },
  { name: "Wiesbaden", latitude: 50.0782, longitude: 8.2398 },
  { name: "Gelsenkirchen", latitude: 51.5177, longitude: 7.0857 },
  { name: "Mönchengladbach", latitude: 51.1805, longitude: 6.4428 },
  { name: "Braunschweig", latitude: 52.2689, longitude: 10.5268 },
  { name: "Aachen", latitude: 50.7753, longitude: 6.0839 },
  { name: "Chemnitz", latitude: 50.8278, longitude: 12.9214 },
  { name: "Kiel", latitude: 54.3233, longitude: 10.1228 },
  { name: "Halle", latitude: 51.4969, longitude: 11.9688 },
  { name: "Magdeburg", latitude: 52.1205, longitude: 11.6276 },
  { name: "Freiburg", latitude: 47.9990, longitude: 7.8421 },
  { name: "Krefeld", latitude: 51.3388, longitude: 6.5853 },
  { name: "Mainz", latitude: 49.9929, longitude: 8.2473 },
  { name: "Lübeck", latitude: 53.8655, longitude: 10.6866 },
  { name: "Erfurt", latitude: 50.9848, longitude: 11.0299 },
  { name: "Oberhausen", latitude: 51.4963, longitude: 6.8528 },
  { name: "Rostock", latitude: 54.0924, longitude: 12.0991 },
  { name: "Kassel", latitude: 51.3127, longitude: 9.4797 },
  { name: "Hagen", latitude: 51.3671, longitude: 7.4633 },
  { name: "Potsdam", latitude: 52.3906, longitude: 13.0645 },
  { name: "Saarbrücken", latitude: 49.2401, longitude: 6.9969 },
  { name: "Hamm", latitude: 51.6739, longitude: 7.8150 },
  { name: "Ludwigshafen", latitude: 49.4741, longitude: 8.4350 },
  { name: "Oldenburg", latitude: 53.1435, longitude: 8.2146 },
  { name: "Osnabrück", latitude: 52.2799, longitude: 8.0472 },
  { name: "Leverkusen", latitude: 51.0459, longitude: 6.9840 },
  { name: "Heidelberg", latitude: 49.3988, longitude: 8.6724 },
  { name: "Darmstadt", latitude: 49.8728, longitude: 8.6512 },
  { name: "Solingen", latitude: 51.1652, longitude: 7.0671 },
  { name: "Regensburg", latitude: 49.0134, longitude: 12.1016 },
  { name: "Paderborn", latitude: 51.7189, longitude: 8.7575 },
  { name: "Ingolstadt", latitude: 48.7665, longitude: 11.4258 },
  { name: "Würzburg", latitude: 49.7913, longitude: 9.9534 },
  { name: "Ulm", latitude: 48.4011, longitude: 9.9876 },
  { name: "Heilbronn", latitude: 49.1427, longitude: 9.2109 },
  { name: "Göttingen", latitude: 51.5413, longitude: 9.9158 },
  { name: "Wolfsburg", latitude: 52.4227, longitude: 10.7865 },
  { name: "Recklinghausen", latitude: 51.6141, longitude: 7.1979 },
];

export const getCityCoordinates = (cityName: string): CityCoordinates | undefined => {
  return GERMAN_CITIES.find(
    (city) => city.name.toLowerCase() === cityName.toLowerCase()
  );
};

export const getCityNames = (): string[] => {
  return GERMAN_CITIES.map((city) => city.name).sort();
};
