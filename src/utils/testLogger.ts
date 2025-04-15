import logger from './logger';

// Test different log levels
logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message', { error: new Error('Test error') });
logger.debug('This is a debug message');

// Test with metadata
logger.info('User action', { 
  userId: '123', 
  action: 'login', 
  timestamp: new Date().toISOString() 
});

// Test with error stack
try {
  throw new Error('Test exception');
} catch (error) {
  logger.error('Caught exception', { error });
}

console.log('Logging test complete. Check the logs directory for output files.'); 