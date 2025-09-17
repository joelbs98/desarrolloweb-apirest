const express = require('express');
const crypto = require('node:crypto');
const app = express();
const cors = require('cors'); // CORS
const movies = require('./movies.json');
const { validateMovie, validatePartialMovie } = require('./schemas/movies');
// const { error } = require('node:console');

app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'https://movies.com'
    ];
    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    if (!origin) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}
)); // CORS
app.disable('x-powered-by');

app.get('/', (req, res) => {
  res.json({ message: 'Hola mundo' });
});
/*
// Todos los recursos que sean Movies se identifica con /movies
app.get('/movies', (req, res) => {
  res.json(movies);
}); */

app.get('/movies/:id', (req, res) => { // poner el : hace el segmento dinamico
  const { id } = req.params;
  const movie = movies.find(movie => movie.id === id);
  if (movie) return res.json(movie);

  res.status(404).json({ message: 'Movie not found' });
});

/* const ACCEPTED_ORIGINS = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://movies.com'
]; */

app.get('/movies', (req, res) => {
  /* const origin = req.header('origin');
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } */
  const { genre } = req.query;
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
    return res.json(filteredMovies);
  }
  res.json(movies);
});

// agregar al inicio -> const crypto = require('node:crypto');
// agregar al inicio -> app.use(express.json());
app.post('/movies', (req, res) => {
  const result = validateMovie(req.body);

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const newMovie = { id: crypto.randomUUID(), ...result.data };

  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria
  movies.push(newMovie);

  res.status(201).json(newMovie);
});

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body);

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }
  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }
  const updateMovie = {
    ...movies[movieIndex], ...result.data
  };
  movies[movieIndex] = updateMovie;
  return res.json(updateMovie);
});

// metodos normales: GET/HEAD/POST
// metodos complejos: PUT/PATCH/DELETE

// Cors PRE-Flight
// Options
/*
app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin');
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  }
  res.send(200);
});
*/
app.delete('/movies/:id', (req, res) => {
  /* const origin = req.header('origin');
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } */
  const { id } = req.params;
  const movieIndex = movies.findIndex(movie => movie.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' });
  }
  movies.splice(movieIndex, 1);

  return res.json({ message: 'Movie deleted' });
});

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});
