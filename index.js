const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv').config();

const config = require('./config.json');

const app = express();

app.use(express.json());

const port = process.env.PORT || 3333;

const server = app.listen(port, () => {
  console.log('Server is running on port: ' + port);
});

const findItem = (version, item) => {
  const foundVersion = config.crafting.find(v => v.version === version);
  const foundItem = foundVersion.items.find(i => i.name === item);

  return foundItem;
};

const formatCrafting = (item) => {
  return item.replace(/-/g, '\n').replace(/;/g, '\n') + '\n';
}

app.get('/', (req, res) => {
  res.send('Use /crafting/:version/:itemName route for crafting API.');
})

app.get('/crafting/:version/:item', (req, res) => {
  const version = req.params.version;
  const itemName = req.params.item;

  const item = findItem(version, itemName);

  if (item === undefined) {
    res.send({ status: 500 });
    return;
  }

  item.crafting = formatCrafting(item.crafting);

  const slots = [];
  let newWord = '';

  for(let i = 0 ; i < item.crafting.length ; i++) {
    if (item.crafting[i] === '\n') {
      slots.push(newWord);
      newWord = '';
      continue;
    }

    newWord += item.crafting[i];
  }

  res.send({ crafting: slots, status: 200 });
});

app.post('/crafting', (req, res) => {
  if (req.body.version === undefined || req.body.name === undefined || req.body.crafting === undefined) {
    res.send({ status: 400 });
    
    console.log('Missing something.')

    return;
  }

  if (req.body.auth !== process.env.KEY) {
    res.sendStatus(401);

    console.log('Not authorized.');

    return;
  }

  const version = req.body.version;
  const name = req.body.name;
  const crafting = req.body.crafting;
  let flag = false;

  for (let i = 0 ; i < config.crafting.length ; i++) {
    
    if (config.crafting[i].version === version) {
      for (let i = 0; i < config.crafting.length; i++) {
        if (config.crafting[i].items.find(i => i.name === name) !== undefined) {
          res.send({
            status: 400,
            error: 'Item already registered.'
          });

          return;
        }
      }
      
      config.crafting[i].items.push({
        name,
        crafting
      });

      flag = true;
    }
  } 
  
  if (flag === false) {
    config.crafting.push({
      version,
      items: [{
        name,
        crafting
      }]
    })
  }

  fs.writeFile(__dirname + '/config.json', JSON.stringify(config), (err) => {
    if (err) {
      console.log(err);

      res.send({
        status: 400,
        error: err
      })
    }
  });

  res.send({
    crafting: {
      version,
      item: {
        name,
        crafting
      }
    },
    status: 200
  });
});