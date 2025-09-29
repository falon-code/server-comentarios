import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Comentarios - Inventario',
      version: '1.0.0',
      description: 'API de solo lectura para armors, items y weapons (Inventario) con sistema de comentarios',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:1802/api',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'http://nexus-battle.com/api',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        UserAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-auth-user'
        },
        BasicAuth: {
          type: 'http',
          scheme: 'basic'
        }
      },
      schemas: {
        Armor: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único de la armadura'
            },
            name: {
              type: 'string',
              description: 'Nombre de la armadura'
            },
            type: {
              type: 'string',
              description: 'Tipo de armadura'
            },
            defense: {
              type: 'number',
              description: 'Puntos de defensa'
            },
            rarity: {
              type: 'string',
              description: 'Rareza del item'
            }
          }
        },
        Item: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del item'
            },
            name: {
              type: 'string',
              description: 'Nombre del item'
            },
            type: {
              type: 'string',
              description: 'Tipo de item'
            },
            description: {
              type: 'string',
              description: 'Descripción del item'
            },
            rarity: {
              type: 'string',
              description: 'Rareza del item'
            }
          }
        },
        Weapon: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del arma'
            },
            name: {
              type: 'string',
              description: 'Nombre del arma'
            },
            type: {
              type: 'string',
              description: 'Tipo de arma'
            },
            damage: {
              type: 'number',
              description: 'Puntos de daño'
            },
            rarity: {
              type: 'string',
              description: 'Rareza del item'
            }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del comentario'
            },
            content: {
              type: 'string',
              description: 'Contenido del comentario'
            },
            username: {
              type: 'string',
              description: 'Usuario que creó el comentario'
            },
            resourceType: {
              type: 'string',
              enum: ['armors', 'items', 'weapons'],
              description: 'Tipo de recurso comentado'
            },
            resourceId: {
              type: 'string',
              description: 'ID del recurso comentado'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            parentId: {
              type: 'string',
              description: 'ID del comentario padre (para respuestas)',
              nullable: true
            }
          }
        },
        CommentInput: {
          type: 'object',
          required: ['content'],
          properties: {
            content: {
              type: 'string',
              description: 'Contenido del comentario',
              minLength: 1,
              maxLength: 1000
            }
          }
        },
        LoginCredentials: {
          type: 'object',
          required: ['user', 'pass'],
          properties: {
            user: {
              type: 'string',
              description: 'Nombre de usuario'
            },
            pass: {
              type: 'string',
              description: 'Contraseña'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la autenticación fue exitosa'
            },
            message: {
              type: 'string',
              description: 'Mensaje de respuesta'
            },
            user: {
              type: 'object',
              properties: {
                username: {
                  type: 'string'
                },
                role: {
                  type: 'string'
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Mensaje de error'
            },
            error: {
              type: 'string',
              description: 'Detalles del error'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Armors',
        description: 'Operaciones relacionadas con armaduras'
      },
      {
        name: 'Items',
        description: 'Operaciones relacionadas con items'
      },
      {
        name: 'Weapons',
        description: 'Operaciones relacionadas con armas'
      },
      {
        name: 'Comments',
        description: 'Sistema de comentarios'
      },
      {
        name: 'Auth',
        description: 'Autenticación y autorización'
      }
    ]
  },
  apis: [
    './src/server_comentarios/view/*.ts', // Rutas de los archivos de documentación
    './src/swagger/docs/*.ts' // Documentación adicional
  ]
};

const specs = swaggerJsdoc(options);
export default specs;