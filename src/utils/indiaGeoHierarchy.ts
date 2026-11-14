import type { LatLngPoint } from './agriMath';

export interface VillageNode {
  name: string;
  lat: number;
  lng: number;
}

export interface TalukaNode {
  name: string;
  lat: number;
  lng: number;
  villages: VillageNode[];
}

export interface DistrictNode {
  name: string;
  lat: number;
  lng: number;
  talukas: TalukaNode[];
}

export interface StateNode {
  name: string;
  lat: number;
  lng: number;
  districts: DistrictNode[];
}

export const INDIA_GEO_HIERARCHY: StateNode[] = [
  {
    name: 'Maharashtra',
    lat: 19.076,
    lng: 75.7139,
    districts: [
      {
        name: 'Pune',
        lat: 18.5204,
        lng: 73.8567,
        talukas: [
          {
            name: 'Baramati',
            lat: 18.151,
            lng: 74.5777,
            villages: [
              { name: 'Malegaon Bk', lat: 18.1517, lng: 74.5767 },
              { name: 'Songaon', lat: 18.1325, lng: 74.5412 },
              { name: 'Baramati', lat: 18.151, lng: 74.5777 },
              { name: 'Pandare', lat: 18.1284, lng: 74.5136 },
              { name: 'Supe', lat: 18.3385, lng: 74.3772 },
              { name: 'Morgaon', lat: 18.2856, lng: 74.3168 },
              { name: 'Katewadi', lat: 18.1072, lng: 74.6615 },
            ],
          },
          {
            name: 'Indapur',
            lat: 18.1135,
            lng: 75.0268,
            villages: [
              { name: 'Indapur', lat: 18.1135, lng: 75.0268 },
              { name: 'Bhigwan', lat: 18.2995, lng: 74.7695 },
              { name: 'Bawda', lat: 18.0462, lng: 75.0914 },
              { name: 'Nimgaon Ketki', lat: 18.179, lng: 74.9092 },
              { name: 'Shelgaon', lat: 18.1945, lng: 74.9562 },
            ],
          },
          {
            name: 'Purandar',
            lat: 18.292,
            lng: 74.11,
            villages: [
              { name: 'Nira', lat: 18.1045, lng: 74.2128 },
              { name: 'Saswad', lat: 18.3422, lng: 74.0315 },
              { name: 'Jejuri', lat: 18.2735, lng: 74.162 },
              { name: 'Walha', lat: 18.187, lng: 74.1428 },
            ],
          },
          {
            name: 'Daund',
            lat: 18.4648,
            lng: 74.5812,
            villages: [
              { name: 'Daund', lat: 18.4648, lng: 74.5812 },
              { name: 'Patas', lat: 18.4368, lng: 74.451 },
              { name: 'Yavat', lat: 18.4728, lng: 74.2742 },
              { name: 'Kedgaon', lat: 18.481, lng: 74.3705 },
            ],
          },
          {
            name: 'Shirur',
            lat: 18.827,
            lng: 74.3746,
            villages: [
              { name: 'Shirur', lat: 18.827, lng: 74.3746 },
              { name: 'Ranjangaon', lat: 18.754, lng: 74.2448 },
              { name: 'Nhavara', lat: 18.6512, lng: 74.341 },
            ],
          },
          {
            name: 'Haveli',
            lat: 18.491,
            lng: 74.05,
            villages: [
              { name: 'Uruli Kanchan', lat: 18.491, lng: 74.132 },
              { name: 'Loni Kalbhor', lat: 18.482, lng: 74.0205 },
              { name: 'Wagholi', lat: 18.5808, lng: 73.9787 },
            ],
          },
        ],
      },
      {
        name: 'Satara',
        lat: 17.6805,
        lng: 74.0183,
        talukas: [
          {
            name: 'Phaltan',
            lat: 17.9912,
            lng: 74.4326,
            villages: [
              { name: 'Phaltan', lat: 17.9912, lng: 74.4326 },
              { name: 'Sakharwadi', lat: 17.9478, lng: 74.3652 },
              { name: 'Taradgaon', lat: 17.9942, lng: 74.245 },
              { name: 'Lonand', lat: 18.0378, lng: 74.1875 },
            ],
          },
          {
            name: 'Karad',
            lat: 17.2896,
            lng: 74.1818,
            villages: [
              { name: 'Karad', lat: 17.2896, lng: 74.1818 },
              { name: 'Umbraj', lat: 17.416, lng: 74.1135 },
              { name: 'Ogalewadi', lat: 17.2952, lng: 74.2152 },
            ],
          },
          {
            name: 'Wai',
            lat: 17.9542,
            lng: 73.8902,
            villages: [
              { name: 'Wai', lat: 17.9542, lng: 73.8902 },
              { name: 'Pachwad', lat: 17.8555, lng: 73.9632 },
              { name: 'Bhuinj', lat: 17.826, lng: 73.951 },
            ],
          },
          {
            name: 'Koregaon',
            lat: 17.6982,
            lng: 74.1632,
            villages: [
              { name: 'Koregaon', lat: 17.6982, lng: 74.1632 },
              { name: 'Rahimatpur', lat: 17.596, lng: 74.2055 },
            ],
          },
        ],
      },
      {
        name: 'Sangli',
        lat: 16.8524,
        lng: 74.5815,
        talukas: [
          {
            name: 'Miraj',
            lat: 16.8222,
            lng: 74.6509,
            villages: [
              { name: 'Miraj', lat: 16.8222, lng: 74.6509 },
              { name: 'Mhaishal', lat: 16.7575, lng: 74.682 },
              { name: 'Bedag', lat: 16.7795, lng: 74.7185 },
            ],
          },
          {
            name: 'Walwa',
            lat: 17.0496,
            lng: 74.265,
            villages: [
              { name: 'Islampur', lat: 17.0496, lng: 74.265 },
              { name: 'Ashta', lat: 16.9522, lng: 74.4108 },
              { name: 'Kasegaon', lat: 17.1362, lng: 74.1972 },
            ],
          },
          {
            name: 'Tasgaon',
            lat: 17.0332,
            lng: 74.603,
            villages: [
              { name: 'Tasgaon', lat: 17.0332, lng: 74.603 },
              { name: 'Savalaj', lat: 17.0462, lng: 74.7495 },
            ],
          },
        ],
      },
      {
        name: 'Kolhapur',
        lat: 16.705,
        lng: 74.2433,
        talukas: [
          {
            name: 'Karvir',
            lat: 16.705,
            lng: 74.2433,
            villages: [
              { name: 'Kolhapur', lat: 16.705, lng: 74.2433 },
              { name: 'Kagal', lat: 16.5782, lng: 74.3168 },
              { name: 'Gokul Shirgaon', lat: 16.6395, lng: 74.281 },
            ],
          },
          {
            name: 'Shirol',
            lat: 16.7378,
            lng: 74.602,
            villages: [
              { name: 'Shirol', lat: 16.7378, lng: 74.602 },
              { name: 'Jaysingpur', lat: 16.7795, lng: 74.5572 },
              { name: 'Kurundwad', lat: 16.688, lng: 74.5912 },
            ],
          },
          {
            name: 'Hatkanangale',
            lat: 16.74,
            lng: 74.43,
            villages: [
              { name: 'Ichalkaranji', lat: 16.6912, lng: 74.4605 },
              { name: 'Vadgaon', lat: 16.8275, lng: 74.3258 },
            ],
          },
        ],
      },
      {
        name: 'Ahmednagar',
        lat: 19.0948,
        lng: 74.748,
        talukas: [
          {
            name: 'Shrirampur',
            lat: 19.6196,
            lng: 74.6596,
            villages: [
              { name: 'Shrirampur', lat: 19.6196, lng: 74.6596 },
              { name: 'Belapur', lat: 19.5632, lng: 74.6485 },
              { name: 'Haregaon', lat: 19.6562, lng: 74.696 },
            ],
          },
          {
            name: 'Rahata',
            lat: 19.713,
            lng: 74.477,
            villages: [
              { name: 'Loni', lat: 19.5772, lng: 74.4685 },
              { name: 'Shirdi', lat: 19.7645, lng: 74.4762 },
              { name: 'Pravaranagar', lat: 19.5892, lng: 74.482 },
            ],
          },
          {
            name: 'Kopargaon',
            lat: 19.8825,
            lng: 74.4775,
            villages: [
              { name: 'Kopargaon', lat: 19.8825, lng: 74.4775 },
              { name: 'Sanjivani', lat: 19.898, lng: 74.468 },
            ],
          },
          {
            name: 'Rahuri',
            lat: 19.3928,
            lng: 74.6488,
            villages: [
              { name: 'Rahuri', lat: 19.3928, lng: 74.6488 },
              { name: 'Deolali Pravara', lat: 19.4765, lng: 74.614 },
            ],
          },
        ],
      },
      {
        name: 'Nashik',
        lat: 19.9975,
        lng: 73.7898,
        talukas: [
          {
            name: 'Niphad',
            lat: 20.0755,
            lng: 74.1078,
            villages: [
              { name: 'Niphad', lat: 20.0755, lng: 74.1078 },
              { name: 'Pimpalgaon Baswant', lat: 20.168, lng: 73.9935 },
              { name: 'Lasalgaon', lat: 20.1455, lng: 74.2285 },
              { name: 'Ozar', lat: 20.0982, lng: 73.9278 },
            ],
          },
          {
            name: 'Dindori',
            lat: 20.2038,
            lng: 73.8405,
            villages: [
              { name: 'Dindori', lat: 20.2038, lng: 73.8405 },
              { name: 'Vani', lat: 20.3308, lng: 73.889 },
            ],
          },
          {
            name: 'Sinnar',
            lat: 19.8452,
            lng: 73.9988,
            villages: [
              { name: 'Sinnar', lat: 19.8452, lng: 73.9988 },
              { name: 'Musalgaon', lat: 19.8405, lng: 74.051 },
            ],
          },
        ],
      },
      {
        name: 'Solapur',
        lat: 17.6599,
        lng: 75.9064,
        talukas: [
          {
            name: 'Malshiras',
            lat: 17.8572,
            lng: 74.9102,
            villages: [
              { name: 'Akluj', lat: 17.8935, lng: 75.0252 },
              { name: 'Malshiras', lat: 17.8572, lng: 74.9102 },
              { name: 'Natepute', lat: 17.8812, lng: 74.7378 },
            ],
          },
          {
            name: 'Pandharpur',
            lat: 17.6742,
            lng: 75.3238,
            villages: [
              { name: 'Pandharpur', lat: 17.6742, lng: 75.3238 },
              { name: 'Karkamb', lat: 17.8615, lng: 75.2912 },
            ],
          },
          {
            name: 'Barshi',
            lat: 18.2345,
            lng: 75.6915,
            villages: [
              { name: 'Barshi', lat: 18.2345, lng: 75.6915 },
              { name: 'Vairag', lat: 18.0672, lng: 75.8058 },
            ],
          },
        ],
      },
      {
        name: 'Nagpur',
        lat: 21.1458,
        lng: 79.0882,
        talukas: [
          {
            name: 'Katol',
            lat: 21.2695,
            lng: 78.5872,
            villages: [
              { name: 'Katol', lat: 21.2695, lng: 78.5872 },
              { name: 'Kondhali', lat: 21.1325, lng: 78.641 },
            ],
          },
          {
            name: 'Saoner',
            lat: 21.3872,
            lng: 78.9188,
            villages: [
              { name: 'Saoner', lat: 21.3872, lng: 78.9188 },
              { name: 'Patansaongi', lat: 21.3185, lng: 78.999 },
            ],
          },
          {
            name: 'Kalmeshwar',
            lat: 21.2335,
            lng: 78.9135,
            villages: [
              { name: 'Kalmeshwar', lat: 21.2335, lng: 78.9135 },
              { name: 'Dhapewada', lat: 21.2755, lng: 78.9472 },
            ],
          },
        ],
      },
      {
        name: 'Chhatrapati Sambhajinagar',
        lat: 19.8762,
        lng: 75.3433,
        talukas: [
          {
            name: 'Paithan',
            lat: 19.4765,
            lng: 75.3852,
            villages: [
              { name: 'Paithan', lat: 19.4765, lng: 75.3852 },
              { name: 'Pachod', lat: 19.5668, lng: 75.6225 },
            ],
          },
          {
            name: 'Gangapur',
            lat: 19.6992,
            lng: 75.0128,
            villages: [
              { name: 'Gangapur', lat: 19.6992, lng: 75.0128 },
              { name: 'Lasur', lat: 19.8398, lng: 74.9802 },
            ],
          },
        ],
      },
      {
        name: 'Jalgaon',
        lat: 21.0077,
        lng: 75.5626,
        talukas: [
          {
            name: 'Raver',
            lat: 21.2495,
            lng: 76.0342,
            villages: [
              { name: 'Raver', lat: 21.2495, lng: 76.0342 },
              { name: 'Savda', lat: 21.1488, lng: 75.8862 },
            ],
          },
          {
            name: 'Yawal',
            lat: 21.1682,
            lng: 75.6982,
            villages: [
              { name: 'Yawal', lat: 21.1682, lng: 75.6982 },
              { name: 'Faizpur', lat: 21.1695, lng: 75.8555 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Karnataka',
    lat: 15.3173,
    lng: 75.7139,
    districts: [
      {
        name: 'Belagavi',
        lat: 15.8497,
        lng: 74.4977,
        talukas: [
          {
            name: 'Athani',
            lat: 16.7262,
            lng: 75.0638,
            villages: [
              { name: 'Athani', lat: 16.7262, lng: 75.0638 },
              { name: 'Kagwad', lat: 16.6952, lng: 74.7322 },
            ],
          },
          {
            name: 'Gokak',
            lat: 16.1695,
            lng: 74.8235,
            villages: [
              { name: 'Gokak', lat: 16.1695, lng: 74.8235 },
              { name: 'Mudalgi', lat: 16.3422, lng: 74.9612 },
            ],
          },
        ],
      },
      {
        name: 'Bagalkot',
        lat: 16.1691,
        lng: 75.6615,
        talukas: [
          {
            name: 'Jamkhandi',
            lat: 16.5048,
            lng: 75.2912,
            villages: [
              { name: 'Jamkhandi', lat: 16.5048, lng: 75.2912 },
              { name: 'Terdal', lat: 16.494, lng: 75.0492 },
            ],
          },
          {
            name: 'Mudhol',
            lat: 16.3278,
            lng: 75.2852,
            villages: [
              { name: 'Mudhol', lat: 16.3278, lng: 75.2852 },
              { name: 'Lokapur', lat: 16.1628, lng: 75.3672 },
            ],
          },
        ],
      },
      {
        name: 'Mandya',
        lat: 12.5218,
        lng: 76.8951,
        talukas: [
          {
            name: 'Mandya',
            lat: 12.5218,
            lng: 76.8951,
            villages: [
              { name: 'Mandya', lat: 12.5218, lng: 76.8951 },
              { name: 'Shivalli', lat: 12.5968, lng: 76.889 },
            ],
          },
          {
            name: 'Maddur',
            lat: 12.5842,
            lng: 77.0438,
            villages: [
              { name: 'Maddur', lat: 12.5842, lng: 77.0438 },
              { name: 'Besagarahalli', lat: 12.642, lng: 76.995 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Gujarat',
    lat: 22.2587,
    lng: 71.1924,
    districts: [
      {
        name: 'Anand',
        lat: 22.5645,
        lng: 72.9289,
        talukas: [
          {
            name: 'Anand',
            lat: 22.5645,
            lng: 72.9289,
            villages: [
              { name: 'Anand', lat: 22.5645, lng: 72.9289 },
              { name: 'Sarsa', lat: 22.5512, lng: 73.0695 },
            ],
          },
          {
            name: 'Borsad',
            lat: 22.4082,
            lng: 72.8982,
            villages: [
              { name: 'Borsad', lat: 22.4082, lng: 72.8982 },
              { name: 'Bhadran', lat: 22.3612, lng: 72.9052 },
            ],
          },
        ],
      },
      {
        name: 'Surat',
        lat: 21.1702,
        lng: 72.8311,
        talukas: [
          {
            name: 'Bardoli',
            lat: 21.1245,
            lng: 73.1128,
            villages: [
              { name: 'Bardoli', lat: 21.1245, lng: 73.1128 },
              { name: 'Mota', lat: 21.1618, lng: 73.0715 },
            ],
          },
          {
            name: 'Kamrej',
            lat: 21.2688,
            lng: 72.9612,
            villages: [
              { name: 'Kamrej', lat: 21.2688, lng: 72.9612 },
              { name: 'Kathor', lat: 21.2982, lng: 72.9282 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Madhya Pradesh',
    lat: 22.9734,
    lng: 78.6569,
    districts: [
      {
        name: 'Indore',
        lat: 22.7196,
        lng: 75.8577,
        talukas: [
          {
            name: 'Sanwer',
            lat: 22.9718,
            lng: 75.8262,
            villages: [
              { name: 'Sanwer', lat: 22.9718, lng: 75.8262 },
              { name: 'Kshipra', lat: 22.8455, lng: 75.9512 },
            ],
          },
          {
            name: 'Mhow',
            lat: 22.5522,
            lng: 75.7565,
            villages: [
              { name: 'Mhow', lat: 22.5522, lng: 75.7565 },
              { name: 'Kodriya', lat: 22.5488, lng: 75.7355 },
            ],
          },
        ],
      },
      {
        name: 'Sehore',
        lat: 23.2032,
        lng: 77.0844,
        talukas: [
          {
            name: 'Sehore',
            lat: 23.2032,
            lng: 77.0844,
            villages: [
              { name: 'Sehore', lat: 23.2032, lng: 77.0844 },
              { name: 'Bilquisganj', lat: 23.1125, lng: 77.211 },
            ],
          },
          {
            name: 'Ashta',
            lat: 23.0205,
            lng: 76.7215,
            villages: [
              { name: 'Ashta', lat: 23.0205, lng: 76.7215 },
              { name: 'Kothri', lat: 23.0812, lng: 76.8142 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Telangana',
    lat: 18.1124,
    lng: 79.0193,
    districts: [
      {
        name: 'Nizamabad',
        lat: 18.6725,
        lng: 78.0941,
        talukas: [
          {
            name: 'Bodhan',
            lat: 18.6625,
            lng: 77.8992,
            villages: [
              { name: 'Bodhan', lat: 18.6625, lng: 77.8992 },
              { name: 'Saloora', lat: 18.724, lng: 77.861 },
            ],
          },
          {
            name: 'Armoor',
            lat: 18.7918,
            lng: 78.2892,
            villages: [
              { name: 'Armoor', lat: 18.7918, lng: 78.2892 },
              { name: 'Perkit', lat: 18.7865, lng: 78.2582 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Punjab',
    lat: 31.1471,
    lng: 75.3412,
    districts: [
      {
        name: 'Ludhiana',
        lat: 30.901,
        lng: 75.8573,
        talukas: [
          {
            name: 'Jagraon',
            lat: 30.788,
            lng: 75.4748,
            villages: [
              { name: 'Jagraon', lat: 30.788, lng: 75.4748 },
              { name: 'Sidhwan Bet', lat: 30.9462, lng: 75.4518 },
            ],
          },
          {
            name: 'Khanna',
            lat: 30.7042,
            lng: 76.2212,
            villages: [
              { name: 'Khanna', lat: 30.7042, lng: 76.2212 },
              { name: 'Samrala', lat: 30.8362, lng: 76.1912 },
            ],
          },
        ],
      },
    ],
  },
];

function norm(s: string | undefined): string {
  return (s || '').trim().toLowerCase();
}

export function getStates(): string[] {
  return INDIA_GEO_HIERARCHY.map((s) => s.name);
}

export function getDistrictsForState(stateName: string): string[] {
  const st = INDIA_GEO_HIERARCHY.find((s) => norm(s.name) === norm(stateName));
  return st ? st.districts.map((d) => d.name) : [];
}

export function getTalukasForDistrict(stateName: string, districtName: string): string[] {
  const st = INDIA_GEO_HIERARCHY.find((s) => norm(s.name) === norm(stateName));
  const dist = st?.districts.find((d) => norm(d.name) === norm(districtName));
  return dist ? dist.talukas.map((t) => t.name) : [];
}

export function getVillagesForTaluka(
  stateName: string,
  districtName: string,
  talukaName: string
): string[] {
  const st = INDIA_GEO_HIERARCHY.find((s) => norm(s.name) === norm(stateName));
  const dist = st?.districts.find((d) => norm(d.name) === norm(districtName));
  const tal = dist?.talukas.find((t) => norm(t.name) === norm(talukaName));
  return tal ? tal.villages.map((v) => v.name) : [];
}

export interface ResolvedGeoLocation {
  lat: number;
  lng: number;
  zoom: number;
  matchedLevel: 'village' | 'taluka' | 'district' | 'state' | 'default';
  label: string;
}

export function resolveGeoLocation(params: {
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
}): ResolvedGeoLocation {
  const stateNode =
    INDIA_GEO_HIERARCHY.find((s) => norm(s.name) === norm(params.state)) ||
    (params.district
      ? INDIA_GEO_HIERARCHY.find((s) =>
          s.districts.some((d) => norm(d.name) === norm(params.district))
        )
      : undefined);

  if (!stateNode) {
    return {
      lat: 18.1517,
      lng: 74.5767,
      zoom: 15,
      matchedLevel: 'default',
      label: 'Malegaon Bk, Baramati, Pune, Maharashtra',
    };
  }

  const distNode = stateNode.districts.find((d) => norm(d.name) === norm(params.district));
  if (!distNode) {
    return {
      lat: stateNode.lat,
      lng: stateNode.lng,
      zoom: 7,
      matchedLevel: 'state',
      label: stateNode.name,
    };
  }

  const talNode = distNode.talukas.find((t) => norm(t.name) === norm(params.taluka));
  if (!talNode) {
    return {
      lat: distNode.lat,
      lng: distNode.lng,
      zoom: 11,
      matchedLevel: 'district',
      label: `${distNode.name}, ${stateNode.name}`,
    };
  }

  const vilNode = talNode.villages.find((v) => norm(v.name) === norm(params.village));
  if (!vilNode) {
    return {
      lat: talNode.lat,
      lng: talNode.lng,
      zoom: 13,
      matchedLevel: 'taluka',
      label: `${talNode.name}, ${distNode.name}, ${stateNode.name}`,
    };
  }

  return {
    lat: vilNode.lat,
    lng: vilNode.lng,
    zoom: 16,
    matchedLevel: 'village',
    label: `${vilNode.name}, ${talNode.name}, ${distNode.name}, ${stateNode.name}`,
  };
}

/**
 * Generates a centered 4-corner starter parcel polygon around (lat, lng)
 * when a farmer selects a new location or loads a 7/12 extract.
 */
export function createStarterParcelPoints(
  lat: number,
  lng: number,
  satbaraSeed?: string
): LatLngPoint[] {
  // Subtle deterministic offset from satbara/survey string so distinct 7/12 entries
  // land nearby within the village rather than overlapping identically.
  let offsetLat = 0;
  let offsetLng = 0;
  if (satbaraSeed && satbaraSeed.trim()) {
    let hash = 0;
    for (let i = 0; i < satbaraSeed.length; i++) {
      hash = (hash * 31 + satbaraSeed.charCodeAt(i)) % 10000;
    }
    offsetLat = ((hash % 21) - 10) * 0.00015;
    offsetLng = (((Math.floor(hash / 21)) % 21) - 10) * 0.00015;
  }

  const cLat = lat + offsetLat;
  const cLng = lng + offsetLng;
  const dLat = 0.00065;
  const dLng = 0.00095;

  return [
    { lat: Number((cLat - dLat).toFixed(6)), lng: Number((cLng - dLng).toFixed(6)) },
    { lat: Number((cLat - dLat).toFixed(6)), lng: Number((cLng + dLng).toFixed(6)) },
    { lat: Number((cLat + dLat).toFixed(6)), lng: Number((cLng + dLng).toFixed(6)) },
    { lat: Number((cLat + dLat).toFixed(6)), lng: Number((cLng - dLng).toFixed(6)) },
  ];
}
