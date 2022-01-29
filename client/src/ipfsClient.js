import { create } from 'ipfs-http-client'

const projectId = process.env.REACT_APP_INFURA_IPFS_PROJECT_ID
const projectSecret = process.env.REACT_APP_INFURA_IPFS_PROJECT_SECRET
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')

// Development (Local)
const localNode = '/ip4/127.0.0.1/tcp/5001'

// Production (Infura)
const infuraNode = {
	host: 'ipfs.infura.io',
	port: 5001,
	protocol: 'https',
	headers: {
		authorization: auth,
	},
}

const ipfsClientConfig = process.env.NODE_ENV === 'production' ? infuraNode : localNode
const ipfsClient = create(ipfsClientConfig)

export default ipfsClient
