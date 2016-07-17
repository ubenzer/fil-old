# Fil

[![Dependency Status](https://david-dm.org/ubenzer/fil.svg)](https://david-dm.org/ubenzer/fil) [![devDependency Status](https://david-dm.org/ubenzer/fil/dev-status.svg)](https://david-dm.org/ubenzer/fil#info=devDependencies)

Fil is a static content engine that can be used to host no-so-dynamic web sites such as blogs, technical documents, 
internal company tech wikies and content management systems.

## Features
1. Super fast!
2. Supports multiple content hierarchies via configuration files.
3. Uses Jade as template engine.
4. You can hook your own asset build system for icons, images, javascripts files etc.

## How to use
No official way to use it for now. You can compile and run it against a content with your own effort.

To watch-reload `fil-data` folder:

`nodemon --harmony --harmony_default_parameters ../.tmp/index.js --verbose -e js,styl,jade`

`nodemon --harmony --harmony_default_parameters ../../fil/.tmp/index.js --verbose -e js,styl,jade`

## Contributing
No defined way of contributing yet. Just go wild. %-)

## Setting up development environment
0. Be sure that you have the latest `Node.js` installed on your machine.
1. Checkout project from git repository.
2. Run `npm install` to install dependencies.

If you make any change to typescript source you can compile it by running `npm run-script dev:compile` to compile. 
I recommend to use an IDE with built-in compiler support to automate this, I recommend Atom or IntelliJ IDEA.
 
## Caution
This project uses experimental Node.js stuff. To list experimental Node.js features run:

```js
node --v8-options | grep "in progress"
```

This project might be using some of them.

## Alternatives

Fil is a project work in progress and no commitments made. If you need a more mature project, you can check
[Jekyll](https://jekyllrb.com/) or [Hexo](https://hexo.io). 
