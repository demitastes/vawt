import config from './config';
import { initDb } from './db/client';
import { initializeDataLoader, cleanupDataLoader } from './data/loader';
import { createApp } from './app';

const start = async () => {
  try {
    console.log('Starting VAWT server...');
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Port: ${config.PORT}`);
    console.log(`Database: ${config.DATABASE_PATH}`);
    console.log(`Data directory: ${config.DATA_DIR}`);

    // Initialize database connection
    initDb();
    console.log('Database connection initialized');

    // Load data files and setup file watchers
    initializeDataLoader();
    console.log('Data loader initialized');

    // Create Express app
    const app = createApp();
    console.log('Express app created');

    // Start server listening
    const server = app.listen(config.PORT, () => {
      console.log(`VAWT server listening on port ${config.PORT}`);
      console.log('Server initialized successfully');
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
      });
      cleanupDataLoader();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
