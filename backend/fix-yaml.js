const fs = require('fs');
const yaml = require('yaml');

// Read existing YAML
const content = fs.readFileSync('src/docs/openapi.yml', 'utf8');
const doc = yaml.parse(content);

// Missing paths to add with their methods
const missingPaths = {
  '/users/verify-email': {
    get: {
      tags: ['Auth'],
      summary: 'Verify user email',
      operationId: 'op_user_verify_email',
      responses: { '200': { description: 'OK' } }
    }
  },
  '/users/resend-verification': {
    post: {
      tags: ['Auth'],
      summary: 'Resend verification email',
      operationId: 'op_user_resend_verification',
      responses: { '200': { description: 'OK' } }
    }
  },
  '/users/change-password': {
    post: {
      tags: ['Auth'],
      summary: 'Change user password',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/users/delete-account': {
    delete: {
      tags: ['Auth'],
      summary: 'Delete user account',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/admins/register': {
    post: {
      tags: ['Admin Auth'],
      summary: 'Register new admin',
      responses: { '201': { description: 'Created' } }
    }
  },
  '/admins/login': {
    post: {
      tags: ['Admin Auth'],
      summary: 'Admin login',
      responses: { '200': { description: 'OK' } }
    }
  },
  '/admins/refresh-token': {
    post: {
      tags: ['Admin Auth'],
      summary: 'Refresh admin token',
      responses: { '200': { description: 'OK' } }
    }
  },
  '/admins/logout': {
    post: {
      tags: ['Admin Auth'],
      summary: 'Admin logout',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/admins/profile': {
    get: {
      tags: ['Admin Auth'],
      summary: 'Get admin profile',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/admin/categories': {
    get: {
      tags: ['Products'],
      summary: 'List categories',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    post: {
      tags: ['Products'],
      summary: 'Create category',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Created' } }
    }
  },
  '/admin/categories/{id}': {
    get: {
      tags: ['Products'],
      summary: 'Get category',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    put: {
      tags: ['Products'],
      summary: 'Update category',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    delete: {
      tags: ['Products'],
      summary: 'Delete category',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/admin/products': {
    get: {
      tags: ['Products'],
      summary: 'List products',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    post: {
      tags: ['Products'],
      summary: 'Create product',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Created' } }
    }
  },
  '/admin/products/{id}': {
    get: {
      tags: ['Products'],
      summary: 'Get product',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    put: {
      tags: ['Products'],
      summary: 'Update product',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    delete: {
      tags: ['Products'],
      summary: 'Delete product',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/admin/products/inventory/adjust': {
    post: {
      tags: ['Inventory'],
      summary: 'Adjust inventory',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/admin/coupons': {
    get: {
      tags: ['Coupons'],
      summary: 'List coupons',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    post: {
      tags: ['Coupons'],
      summary: 'Create coupon',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Created' } }
    }
  },
  '/admin/coupons/{id}': {
    put: {
      tags: ['Coupons'],
      summary: 'Update coupon',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    delete: {
      tags: ['Coupons'],
      summary: 'Delete coupon',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/cart': {
    get: {
      tags: ['Cart'],
      summary: 'Get cart',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    delete: {
      tags: ['Cart'],
      summary: 'Clear cart',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/cart/items': {
    post: {
      tags: ['Cart'],
      summary: 'Add item to cart',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Created' } }
    }
  },
  '/cart/items/{id}': {
    put: {
      tags: ['Cart'],
      summary: 'Update cart item',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    delete: {
      tags: ['Cart'],
      summary: 'Remove cart item',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/wishlist': {
    get: {
      tags: ['Wishlist'],
      summary: 'Get wishlist',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    },
    post: {
      tags: ['Wishlist'],
      summary: 'Add to wishlist',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Created' } }
    }
  },
  '/wishlist/{id}': {
    delete: {
      tags: ['Wishlist'],
      summary: 'Remove from wishlist',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/orders': {
    post: {
      tags: ['Orders'],
      summary: 'Create order',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Created' } }
    },
    get: {
      tags: ['Orders'],
      summary: 'List orders',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/orders/{id}': {
    get: {
      tags: ['Orders'],
      summary: 'Get order',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/orders/{id}/cancel': {
    put: {
      tags: ['Orders'],
      summary: 'Cancel order',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/coupon/apply': {
    post: {
      tags: ['Coupons'],
      summary: 'Apply coupon',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/payments/initiate': {
    post: {
      tags: ['Payments'],
      summary: 'Initiate payment',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/payments/verify': {
    post: {
      tags: ['Payments'],
      summary: 'Verify payment',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/returns': {
    post: {
      tags: ['Returns'],
      summary: 'Create return request',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Created' } }
    },
    get: {
      tags: ['Returns'],
      summary: 'List returns',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  },
  '/returns/{id}': {
    get: {
      tags: ['Returns'],
      summary: 'Get return',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'OK' } }
    }
  }
};

// Add missing paths to doc.paths
Object.keys(missingPaths).forEach(path => {
  doc.paths[path] = missingPaths[path];
});

// Write back
const updatedYaml = yaml.stringify(doc);
fs.writeFileSync('src/docs/openapi.yml', updatedYaml);

console.log('Added ' + Object.keys(missingPaths).length + ' missing paths');
console.log('Total paths now: ' + Object.keys(doc.paths).length);
