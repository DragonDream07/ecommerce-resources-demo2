const db = require('../knex');

const TABLE = 'categories';

async function findById(id) {
  return db(TABLE).where({ id }).first();
}

async function findBySlug(slug) {
  return db(TABLE).where({ slug }).first();
}

async function findAll({ limit = 100, offset = 0 } = {}) {
  return db(TABLE).limit(limit).offset(offset);
}

async function findRoots() {
  return db(TABLE).whereNull('parent_id').select('*');
}

async function findChildren(parentId) {
  return db(TABLE).where({ parent_id: parentId }).select('*');
}

async function create(data) {
  const [id] = await db(TABLE).insert(data);
  return findById(id);
}

async function update(id, data) {
  await db(TABLE).where({ id }).update(data);
  return findById(id);
}

async function remove(id) {
  return db(TABLE).where({ id }).del();
}

async function getAncestors(id) {
  const ancestors = [];
  let current = await findById(id);
  while (current && current.parent_id) {
    current = await findById(current.parent_id);
    if (current) ancestors.unshift(current);
  }
  return ancestors;
}

async function getDescendants(id) {
  const result = [];
  const queue = await findChildren(id);
  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);
    const children = await findChildren(node.id);
    queue.push(...children);
  }
  return result;
}

async function getTree() {
  const all = await db(TABLE).select('*');
  const map = {};
  all.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });
  const roots = [];
  all.forEach((cat) => {
    if (cat.parent_id && map[cat.parent_id]) {
      map[cat.parent_id].children.push(map[cat.id]);
    } else if (!cat.parent_id) {
      roots.push(map[cat.id]);
    }
  });
  return roots;
}

module.exports = {
  findById,
  findBySlug,
  findAll,
  findRoots,
  findChildren,
  create,
  update,
  remove,
  getAncestors,
  getDescendants,
  getTree,
};
