# LostClipArt

An svg images manager.

![](https://lostclipart.sigwait.tk/clipart/thumbnails/1/35436.png)

## Prerecs

Let's code like it's 2005! Why 2005? It was the world w/o Rails &
widespread ORMs. JFF.

* Backend: node, connect, sqlite (yes).
* Frontend: React.
* Build system: make; no bundlers, except for 1 case when there's a
  shared peace of code b/n the server & the client, hence browserify
  is used.
* Deployment: a containerization w/ systemd (yes)

~~~
$ make cloc
cloc --script-lang=JavaScript,node \
  --exclude-ext=md client lib *.sql *.js Makefile
      28 text files.
      28 unique files.
       5 files ignored.

github.com/AlDanial/cloc v 1.83  T=0.04 s (582.3 files/s, 73065.1 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
JSX                             15            226             32           1286
JavaScript                       4            127             16            741
CSS                              1             59              1            193
make                             1             22              0             69
SQL                              1             11              4             66
HTML                             1              7              1             25
-------------------------------------------------------------------------------
SUM:                            23            452             54           2380
~~~

## Deploying

Reqs:

* a systemd 241+ distro
* a user must be able to run under sudo: `systemctl`, `systemd-run`, `rm`.

0. Choose an umbrella dir for the app, e.g. `~/my-app` (`$APP` below).

1. Grab a node 15.x tarball & unpack it in `$APP`:

        $ cd $APP
        $ tar xfJ node-v15*tar.xz
        $ ln -s node-v15.13.0-linux-x64 node

    then add `$APP/node` to the PATH.

2. Get the src & compile:

        $ npm i -g json adieu browserify exorcist

        $ git clone git@github.com:gromnitsky/lostclipart.git src
        $ cd src
        $ npm i
        $ make

3. Run the app in the development mode at http://127.0.0.1:3000

        $ make devel

4. Read the logs:

        $ make log

5. Stop the app:

        $ systemctl stop lostclipart --user

6. Run the app in the production mode:

        $ make prod restart=1 node.dir=~/app/node-v15.13.0-linux-x64

7. Stop:

        $ sudo systemctl stop lostclipart

Relevant env vars:

    $ git grep process.env\\.


## License

MIT.
