<h1 align="center">up</h1>
<p align="center">Deployments made simple.</p>

<p align="center">
    <a href="https://circleci.com/gh/karimsa/up">
        <img src="https://circleci.com/gh/karimsa/up.svg?style=svg&circle-token=902bfd0591071ac19563f3d1a3f3ade10ab7a10d" alt="CircleCI" />
    </a>
</p>

## What's `up`?

`up` is a deployment tool meant to allow the deployment of load-balanced application clusters without extra config. You can think of it as a PaaS tool that utilizes an IaaS provider like DigitalOcean and provides the platform abstractions on the client-side instead of the server-side.

## Getting Started

### Log into your provider

The default provider is digitalocean - no other providers are currently supported.

```
$ up login
Please enter your API key:
```

### Deploy your application

```
$ up
(Will spin up your dev environment)
```

For deployment, up only deploys three files from your repository: `package.json`, `package-lock.json` and whatever file is configured as `main` under `package.json` (defaulting to `index.js`).

Before shipping your entrypoint, parcel will be used to bundle all your local dependencies. Your third-party dependencies will be installed onto each server using `npm`.

## More things you can do

### Horizontally scale your deployment

To scale your deployment, you can use either an exact number that you want to use as the size of your application cluster - or a scaling expression to add/remove some number of clusters.

Here's some examples:

```shell
# add one instance
$ up scale :+1

# remove one instance
$ up scale :-1

# scale to 5 instances
$ up scale 5
```

### Restart application servers

Here's some examples:

```shell
# restarts all servers in the cluster
$ up restart
```

### Setting environment variables

Environment variables are shared between all computers within an application cluster (there's only one application cluster supported per `package.json` for now).

Here's some examples:

```shell
# list all your environment variables
$ up env
    NODE_ENV    =>  'production'
    PORT        =>  80

# fetch the value for MONGO_URI from any server in the cluster
$ up env MONGO_URI

# fetch the value for MONGO_URI from every server in the cluster
$ up env MONGO_URI --all

# sets 'MONGO_URI'
$ up env MONGO_URI 'mongodb://localhost/app'
```

### View application logs

Here's some examples:

```shell
# prints logs from all servers in cluster
$ up logs

# prints logs in tail mode
$ up logs -f
```

### List all application servers

Here's some examples:

```shell
# lists all servers in your cluster
$ up list
```

### Check the status of a deployment

```shell
# Lists all servers & their current status including time
# since last deployment and the running application version
$ up status
Number of servers: 1

 - myapp-development-1 [116845563 - RUNNING]:
        IP: 123.456.789.100
        Uptime: 6m 6s
        App version: 0.1.1
        Bundle hash: 887b7d69ae
```

### Execute a command within a virtual environment

up comes with a utility command for you to run any command hoisted into a virtual environment that is composed of the same environment variables as your application cluster.

Environment variables from the remote environment will be given precedance over local variables, but the two environments will be merged for the child process. So if you have any implicit defaults, you might run into issues (moral: use explicit defaults).

Here's some examples:

```shell
$ up exec -- export
$ up exec -- node scripts/blah.js
```

## License

Licensed under MIT license.

Copyright &copy; 2019-present. Karim Alibhai.
