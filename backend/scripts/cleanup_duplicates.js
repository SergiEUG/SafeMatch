/**
 * Limpieza segura de duplicados en MongoDB (por email) para la colección users.
 * Mantiene 1 documento por email (el más reciente por createdAt), elimina el resto.
 *
 * Uso:
 *   node scripts/cleanup_duplicates.js
 */

const mongoose = require('mongoose');
const env = require('../src/config/env');
const { User } = require('../src/models');

async function main() {
  const uri = env.MONGODB_URI || env.mongodbUri;
  if (!uri) throw new Error('MONGODB_URI no definida');

  await mongoose.connect(uri);
  console.log('[cleanup] Conectado a Mongo');

  // Encontrar emails duplicados
  const dupes = await User.aggregate([
    { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 }, _id: { $ne: null } } },
  ]);

  if (dupes.length === 0) {
    console.log('[cleanup] No se encontraron duplicados por email ✅');
    return;
  }

  console.log(`[cleanup] Encontrados ${dupes.length} emails duplicados`);

  let totalToDelete = 0;
  const idsToDelete = [];

  for (const d of dupes) {
    const email = d._id;
    const users = await User.find({ email }).select('_id createdAt').sort({ createdAt: -1 }).lean();
    const [keep, ...rest] = users;
    const restIds = rest.map(u => u._id);
    totalToDelete += restIds.length;
    idsToDelete.push(...restIds);
    console.log(`[cleanup] email=${email} keep=${keep?._id} delete=${restIds.length}`);
  }

  if (totalToDelete === 0) {
    console.log('[cleanup] Nada que borrar');
    return;
  }

  const res = await User.deleteMany({ _id: { $in: idsToDelete } });
  console.log(`[cleanup] Eliminados ${res.deletedCount} documentos duplicados ✅`);
}

main()
  .catch((e) => {
    console.error('[cleanup] ERROR:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await mongoose.disconnect(); } catch {}
  });



