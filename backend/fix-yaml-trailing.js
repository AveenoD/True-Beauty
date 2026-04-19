const fs = require('fs');
const yaml = require('yaml');

// Read current YAML
const content = fs.readFileSync('src/docs/openapi.yml', 'utf8');
let doc = yaml.parse(content);

// Fix paths - add trailing slash where needed
const pathFixes = {
  '/admin/categories': '/admin/categories/',
  '/admin/products': '/admin/products/',
  '/admin/coupons': '/admin/coupons/',
  '/cart': '/cart/',
  '/wishlist': '/wishlist/',
  '/orders': '/orders/',
  '/returns': '/returns/',
  '/plans': '/plans/',
};

// Rename paths
const newPaths = {};
Object.keys(doc.paths).forEach(key => {
  const newKey = pathFixes[key] || key;
  newPaths[newKey] = doc.paths[key];
});
doc.paths = newPaths;

// Write back
const updatedYaml = yaml.stringify(doc);
fs.writeFileSync('src/docs/openapi.yml', updatedYaml);

console.log('Fixed trailing slashes in ' + Object.keys(pathFixes).length + ' paths');
console.log('Total paths now: ' + Object.keys(doc.paths).length);
