const axios = require('axios').default;
const async = require('async');
const fs = require('fs');

function firstCap(str) {
  if (typeof str !== 'string') {
    throw new Error();
  }
  try {
    return str
      .replace('&nbsp;', ' ')
      .trim()
      .split(' ')
      .map(
        substr => substr[0].toUpperCase() + substr.slice(1).toLocaleLowerCase()
      )
      .join(' ');
  } catch (e) {
    console.log(str);
  }
}

async function getDistrict(zone) {
  const result = await axios.get(
    `https://www1.hongkongpost.hk/correct_addressing/GetDistrict.jsp?zone_value=${zone}&lang=c&lang1=zh_TW`
  );
  return result.data
    .split('\r\n')
    .filter(str => str !== '')
    .map(str => str.match(/<option value="(.+?)">(.*?)(\(.*?\))<\/option>/))
    .filter(Boolean)
    .map(([_, district, eng, chi]) => ({
      district: parseInt(district, 10),
      name: firstCap(eng) + ' ' + chi
    }));
}

async function getStreets(region, district) {
  const result = await axios.get(
    `https://www1.hongkongpost.hk/correct_addressing/GetStreet.jsp?type_value=Street&zone=${region}&district=${district}&lang=zh_TW&street=&estate=&phase=`
  );

  return result.data
    .split('\r\n')
    .filter(str => str !== '')
    .map(str => str.match(/<option value="(.+?)">(.*?)(\(.*?\))<\/option>/))
    .filter(Boolean)
    .map(([_, street, eng, chi]) => ({
      street: firstCap(street),
      name: firstCap(eng) + ' ' + chi
    }));
}

const regions = [
  {
    region: 1,
    name: 'Hong Kong (香港)'
  },
  {
    region: 2,
    name: 'Kowloon (九龍)'
  },
  {
    region: 3,
    name: 'New Territories (新界)'
  }
];

(async () => {
  const result = await async.map(regions, async ({ region, name }) => {
    const districtList = await getDistrict(region);
    const districts = await async.map(districtList, async district => {
      const streets = await getStreets(region, district.district);
      return {
        ...district,
        streets
      };
    });
    return {
      region,
      name,
      districts
    };
  });
  fs.writeFile('data.json', JSON.stringify(result, null, 2), function(err) {
    if (err) {
      console.log(err);
    }
  });
})();
