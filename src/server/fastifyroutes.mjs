
export default function routes(fastify, opts, done){
  fastify.get('/test', async (request, reply)=>{
    console.log("test????")
    reply.send({ hello: 'world' })
  })
  done()
}