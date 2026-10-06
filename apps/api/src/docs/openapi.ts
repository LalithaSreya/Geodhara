export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'GeoDhara API',
    version: '1.0.0',
    description:
      'Integrated GIS-based Digital Public Infrastructure for Land Governance (SIH 2026 Prototype PS 26014).\n\nTagline: **"One parcel. One identity."**\n\n*Notice: DEMO ENVIRONMENT. All data is synthetic. Government integrations are mock adapters.*',
  },
  servers: [
    {
      url: '/api',
      description: 'API Base Server',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        responses: {
          '200': {
            description: 'API and database are operational',
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User authentication',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'citizen@geodhara.demo' },
                  password: { type: 'string', example: 'DemoCitizen@123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'JWT authentication token' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/ulpin/validate': {
      post: {
        summary: 'Validate 14-character alphanumeric ULPIN syntax and existence',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['ulpin'],
                properties: {
                  ulpin: { type: 'string', example: 'TS7A2K91M4P6X8' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'ULPIN validation status' },
        },
      },
    },
    '/ulpin/{ulpin}': {
      get: {
        summary: 'Resolve parcel identity by 14-character ULPIN',
        parameters: [
          {
            name: 'ulpin',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'TS7A2K91M4P6X8' },
          },
        ],
        responses: {
          '200': { description: 'Resolved parcel summary and geometry' },
          '404': { description: 'ULPIN not found' },
        },
      },
    },
    '/parcels': {
      get: {
        summary: 'Get parcels as GeoJSON FeatureCollection with spatial bounding box filter',
        parameters: [
          { name: 'bbox', in: 'query', schema: { type: 'string', example: '78.4,17.5,78.6,17.7' } },
          { name: 'state', in: 'query', schema: { type: 'string', example: 'TS' } },
          { name: 'village', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'GeoJSON FeatureCollection of cadastral parcels' },
        },
      },
    },
    '/parcels/{ulpin}': {
      get: {
        summary: '360° Unified Parcel Inspector (geometry, RoR, owners, deeds, encumbrances, litigation, alerts, audit)',
        parameters: [
          { name: 'ulpin', in: 'path', required: true, schema: { type: 'string', example: 'TS7A2K91M4P6X8' } },
        ],
        responses: {
          '200': { description: 'Comprehensive unified digital dossier' },
        },
      },
    },
    '/mutation': {
      get: {
        summary: 'List mutation applications',
        responses: {
          '200': { description: 'List of applications with event history' },
        },
      },
      post: {
        summary: 'Submit new mutation application (runs automated validation engine)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['parcelId', 'applicant'],
                properties: {
                  parcelId: { type: 'string', format: 'uuid' },
                  registrationId: { type: 'string', format: 'uuid' },
                  applicant: {
                    type: 'object',
                    required: ['name', 'id_number'],
                    properties: {
                      name: { type: 'string' },
                      id_number: { type: 'string' },
                      email: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Mutation application created with calculated risk score' },
        },
      },
    },
    '/parcels/{ulpin}/risk': {
      get: {
        summary: 'Explainable 12-rule transparent risk evaluation for a parcel',
        parameters: [
          { name: 'ulpin', in: 'path', required: true, schema: { type: 'string', example: 'TS7A2K91M4P6X8' } },
        ],
        responses: {
          '200': { description: 'Explainable risk score (0-100), level (LOW/MEDIUM/HIGH/CRITICAL), and 12-rule breakdown' },
        },
      },
    },
    '/mutation/{id}/risk': {
      get: {
        summary: 'Explainable 12-rule transparent risk evaluation for a mutation application',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Explainable mutation risk breakdown and score' },
        },
      },
    },
    '/risk/overview': {
      get: {
        summary: 'State-wide risk telemetry and high-risk parcel overview',
        responses: {
          '200': { description: 'Overview metrics and high-risk ranking' },
        },
      },
    },
    '/mutation/{id}': {
      get: {
        summary: 'Get single mutation application with complete 360 context and 11 rule validation checks',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Full mutation application dossier with live validation checks' },
          '404': { description: 'Mutation application not found' },
        },
      },
    },
    '/mutation/validate': {
      post: {
        summary: 'Dry-run evaluation of all 11 automated validation rules without persisting',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['parcelId'],
                properties: {
                  parcelId: { type: 'string', format: 'uuid' },
                  registrationId: { type: 'string', format: 'uuid' },
                  sellerName: { type: 'string' },
                  applicant: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      id_number: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '11 validation checks, risk score, and pass/block/flag result' },
        },
      },
    },
    '/registrations': {
      post: {
        summary: 'Record synthetic deed registration and automatically trigger linked mutation application',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['parcelId', 'documentNumber', 'seller', 'buyer', 'registeredAreaSqm', 'considerationAmount'],
                properties: {
                  parcelId: { type: 'string', format: 'uuid' },
                  documentNumber: { type: 'string' },
                  registrationDate: { type: 'string', format: 'date' },
                  seller: { type: 'string' },
                  buyer: { type: 'string' },
                  registeredAreaSqm: { type: 'number' },
                  considerationAmount: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Registration detected — mutation application created.' },
        },
      },
    },
    '/mutation/{id}/transition': {
      post: {
        summary: 'Transition mutation status in workflow state machine (with optimistic concurrency check)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['targetStatus', 'reason'],
                properties: {
                  targetStatus: {
                    type: 'string',
                    enum: [
                      'AUTO_VALIDATED',
                      'BLOCKED',
                      'OFFICER_REVIEW',
                      'FIELD_VERIFICATION',
                      'APPROVED',
                      'RECORD_UPDATED',
                      'REJECTED',
                    ],
                  },
                  reason: { type: 'string' },
                  expectedVersion: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated mutation application' },
          '400': { description: 'Invalid state transition' },
          '409': { description: 'Version conflict (optimistic lock failed)' },
        },
      },
    },
    '/audit/verify': {
      get: {
        summary: 'Verify cryptographic hash chain integrity of the immutable audit ledger',
        responses: {
          '200': { description: 'Hash chain verification status' },
        },
      },
    },
    '/change-alerts': {
      get: {
        summary: 'List satellite change detection alerts',
        responses: {
          '200': { description: 'List of change alerts with polygon geometries' },
        },
      },
    },
    '/field/sync': {
      post: {
        summary: 'Batch sync offline field observations from PWA / Dexie client',
        responses: {
          '200': { description: 'Sync results with conflict resolution report' },
        },
      },
    },
  },
};
