/**
 * Faz a paginação utilizando o ID como base
 * @param query
 * @param modelo
 * @param ultimo
 * @param limite
 * @returns {Promise<{documentos: [Object], tamanho: Number, ultimoId: }>}
 */
const paginar = async (query, modelo, ultimo=null, limite=1000) => {

  console.log('iniciando paginacao')
  if (ultimo)
    query._id = {$gt: ultimo}

  console.log('iniciando query')
  let documentos = await modelo
    .find(query)
    .sort({_id: 1})
    .limit(limite)

  console.log('query finalizada')
  let response = {
    documentos: documentos,
    tamanho: documentos.length
  }

  if (documentos.length > 0)
    response.ultimoId = documentos[documentos.length - 1];

  console.log('retornando')
  return response;
}

module.exports.paginar = paginar;