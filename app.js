const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { v4: uuidv4 } = require('uuid'); 

const app = express();
const port = 4000;

app.use(express.json());

const dataFilePath = path.join(__dirname, 'data.json');
// Read data from the JSON file
async function readData() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write data to the JSON file
async function writeData(data) {
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The ID of the item.
 *         name:
 *           type: string
 *           description: The name of the item.
 */

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get all items
 *     responses:
 *       200:
 *         description: A list of items.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 */
app.get('/items', async (_req, res) => {
  const data = await readData();
  res.json(data);
});


/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get a single item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the item.
 *     responses:
 *       200:
 *         description: The requested item.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       404:
 *         description: Item not found.
 */
app.get('/items/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const data = await readData();
  const item = data.find(item => item.id === id);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ message: 'Item not found' });
  }
});

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Item'
 *     responses:
 *       201:
 *         description: The newly created item.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 */
app.post('/items', async (req, res) => {
  const newItem = req.body;
  const data = await readData();
  
  // Generate a new UUIDv4 ID for the item
  newItem.id = uuidv4();

  data.push(newItem);
  await writeData(data);
  res.status(201).json(newItem);
});


// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Express API with Swagger',
      version: '1.0.0',
    },
    components: {
      schemas: {
        Item: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'The ID of the item.',
            },
            name: {
              type: 'string',
              description: 'The name of the item.',
            },
          },
        },
      },
    },
    
    
  },
  apis: ['app.js'], // Add the path to your JavaScript file
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
