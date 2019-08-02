const fs = require('fs');
const async = require('async');
const axios = require('axios').default;

const makeUrl = address =>
  `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyBfnewz1T8JnQtppwVvXwN2QVAbatvWfOQ`;

fs.readFile('./test.txt', async (err, data) => {
  const places = data
    .toString()
    .split('\n')
    .map(entry => entry.split(','));
  const withGeo = await async.map(places, async place => {
    try {
      const res = await axios.get(makeUrl(place[2]));
      console.log(res.results[0].geometry.location);
      const location = res.results[0].geometry.location;
      return [...place, location.lat, location.lng];
    } catch (e) {
      // console.log(place[2]);
    }
  });
  console.log(withGeo);
  // const toCSV = withGeo.map(place => place.join(',')).join('\n');
  // fs.writeFileSync('withGeo.csv', toCSV, 'utf8');
});
