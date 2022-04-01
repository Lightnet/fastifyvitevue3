



// https://github.com/fastify/fastify-express

import fs from "fs"
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import Fastify from "fastify";
import fastifyExpress from "fastify-express";
import {createServer} from "vite";
import compression from "compression"
//import fastifyStatic from "fastify-static"
import serveStatic from "serve-static"
import Youch from "youch"
import fastifyRoutes from "./src/server/fastifyroutes.mjs"
import expressRoutes from "./src/server/expressroutes.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url));

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD;

async function createFastifyServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production'
){
  const fastify = Fastify({
    logger: false
  })

  //fastify.register(fastifyStatic, {
    //root: path.join(__dirname, '.'),
    //root: path.join(__dirname, 'public'),
    //prefix: '/public/', // optional: default '/'
  //})

  //console.log(routes);
  await fastify.register(fastifyRoutes, { prefix: '/' })
  
  const resolve = (p) => path.resolve(__dirname, p)

  fastify.addHook('onRequest', async (req, reply) => {
    console.log('first 0')
  })

  await fastify.register(fastifyExpress)
  //fastify.addHook('onRequest', async (req, reply) => {
    //console.log('first 00')
  //})
  fastify.use((req, res, next) => {
    console.log('second')
    next()
  })
  //await fastify.register(subsystem)

  const indexProd = isProd
    ? fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
    : ''

  const manifest = isProd
    ? // @ts-ignore
    require('./dist/client/ssr-manifest.json')
    : {}

  //async function subsystem (fastify, opts) {
    //console.log("subsystem")
    fastify.use("/",expressRoutes)
    let vite;

    if (!isProd) {
      vite = await createServer({
        root,
        logLevel: isTest ? 'error' : 'info',
        server: {
          middlewareMode: 'ssr',
          watch: {
            // During tests we edit the files too fast and sometimes chokidar
            // misses change events, so enforce polling for consistency
            usePolling: true,
            interval: 100
          }
        }
      })
      // use vite's connect instance as middleware
      fastify.use(vite.middlewares)
    } else {
      fastify.use(compression())
      fastify.use(
        serveStatic(resolve('dist/client'), {
          index: false
        })
      )
    }
    

    // https://www.fastify.io/docs/latest/Reference/Middleware/
    fastify.use('*', async (req, res) => {
    //fastify.routing
      console.log(req.originalUrl)
      try {
        const url = req.originalUrl
        let template, render
        if (!isProd) {
          // always read fresh template in dev
          template = fs.readFileSync(resolve('index.html'), 'utf-8')
          template = await vite.transformIndexHtml(url, template)
          render = (await vite.ssrLoadModule('/src/entry-server.js')).render
        } else {
          template = indexProd
          render = require('./dist/server/entry-server.js').render
        }

        const [appHtml, preloadLinks] = await render(url, manifest)

        const html = template
          .replace(`<!--preload-links-->`, preloadLinks)
          .replace(`<!--app-html-->`, appHtml)

        res
          .status(200)
          .set({ 'Content-Type': 'text/html' })
          .end(html)
      } catch (e) {
        const youch = new Youch(e, req)
        
        //vite && vite.ssrFixStacktrace(e)
        console.log(e.stack)

        youch
          .toHTML()
          .then(() => {
            res
              .writeHead(200, { 'content-type': 'text/html' })
              .end(e.stack)
          })
      }
    });

    //fastify.get('/', async (req, res) => {
      //res.send("Hello world")
    //})

    //fastify.addHook('onRequest', async (req, reply) => {
      //console.log('first')
    //})

    //fastify.use((req, res, next) => {
      //console.log('second')
      //next()
    //})
  //}
  

  return { app:fastify }
}

if (!isTest) {
  const { app } = await createFastifyServer();
  //console.log(app)
  app.listen(3000, () => {
    console.log(` Fastify Server listenting on http://localhost:${app.server.address().port}`)
  })
}

export default createFastifyServer;