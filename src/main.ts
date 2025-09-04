import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration from environment
  const port = process.env.PORT || 3001;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const apiPrefix = process.env.API_PREFIX || 'api';

  // Enhanced CORS configuration - FIRST before any other middleware
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];

  // In development, allow all origins. In production, use specific origins
  const corsConfig = {
    origin: true, // Temporarily allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-HTTP-Method-Override',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
    ],
    exposedHeaders: ['Content-Length', 'Content-Range', 'X-Content-Range'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200, // For legacy browser support (IE11, various SmartTVs)
  };

  app.enableCors(corsConfig);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Set global prefix AFTER CORS configuration
  app.setGlobalPrefix(apiPrefix);

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    app.close().then(() => {
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    app
      .close()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
      });
  });

  // Start the server
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces

  // Log startup information
  const appUrl = await app.getUrl();
  console.log('🎉 ===============================================');
  console.log(`🚀 Application is running on: ${appUrl}`);
  console.log(`📋 API endpoints available at: ${appUrl}/${apiPrefix}`);
  console.log(`🔧 Environment: ${nodeEnv}`);
  console.log(`🎯 Port: ${port}`);
  console.log(
    `🌐 CORS Origins: ${nodeEnv === 'development' ? 'All origins allowed' : corsOrigins.join(', ')}`,
  );
  console.log('🎉 ===============================================');
}

bootstrap().catch((error) => {
  console.error('❌ Error starting the application:', error);
  console.error('Stack trace:', error);
  process.exit(1);
});
