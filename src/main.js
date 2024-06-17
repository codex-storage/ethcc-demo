// import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import uniqueId from '@/plugins/UniqueIdPlugin'

import App from '@/App.vue'
import router from '@/router'
import ethersPlugin from '@/plugins/EthersPlugin'
import codexPlugin from '@/plugins/CodexPlugin'
import marketplacePlugin from '@/plugins/MarketplacePlugin'
import testTokenPlugin from '@/plugins/TestTokenPlugin'

import './index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
const environments = {
  localhost: {
    marketplaceAddress: '0x80CC244f93569DAbdC18D182aAF382824Ddf2d96',
    testTokenAddress: '0x0C7c8CC92A994918b05eBbc4CBdF9f58b901162d',
    myAddress: '0xE3b2588a05260caC3EEAbfBFd7937BbC14eB0aC7',
    rpcUrl: 'http://localhost:8545',
    codexRestUrl: 'http://localhost:8080/api/codex/v1'
  },
  devnet: {
    // marketplaceAddress: '0x9C88D67c7C745D2F0A4E411c18A6a22c15b37EaA', // new devnet contracts
    marketplaceAddress: '0x4cBDfab37baB0AA3AC69A7b12C4396907dfF5227', // old devnet contracts
    testTokenAddress: '0x150493837F923E71Ad8289742Ae8f2Bd7a478964',
    myAddress: '0xE3b2588a05260caC3EEAbfBFd7937BbC14eB0aC7',
    rpcUrl: 'https://rpc.testnet.codex.storage',
    codexRestUrl: 'http://localhost:8080/api/codex/v1'
  }
}

// NOTE: setting current environment to localhost requires manual steps:
// 1. double-check token and marketplace/token contract addresses haven't
//    changed in deployment-localhost.json. If they have:
//      a. update in `environments`
//      b. update --marketplace-address cli param in codex.sh
// 2. in hardhat.config.js used to run the local node, add your PK to the local
//    network:
// ```json
// networks: {
//   hardhat: {
//     tags: ["local"],
//     accounts: [
//       {
//         privateKey: "<my pk>",
//         balance: ethers.utils.parseEther('10000').toString()
//       }
//     ]
//   }
// ```
const ENV = environments.devnet // FOR LOCALHOST, SEE ABOVE
app.config.globalProperties.rpcUrl = ENV.rpcUrl

app.use(ethersPlugin, {})
app.use(marketplacePlugin, {
  abi: [
    {
      inputs: [
        {
          components: [
            {
              components: [
                {
                  internalType: 'uint8',
                  name: 'repairRewardPercentage',
                  type: 'uint8'
                },
                {
                  internalType: 'uint8',
                  name: 'maxNumberOfSlashes',
                  type: 'uint8'
                },
                {
                  internalType: 'uint16',
                  name: 'slashCriterion',
                  type: 'uint16'
                },
                {
                  internalType: 'uint8',
                  name: 'slashPercentage',
                  type: 'uint8'
                }
              ],
              internalType: 'struct CollateralConfig',
              name: 'collateral',
              type: 'tuple'
            },
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'period',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'timeout',
                  type: 'uint256'
                },
                {
                  internalType: 'uint8',
                  name: 'downtime',
                  type: 'uint8'
                },
                {
                  internalType: 'string',
                  name: 'zkeyHash',
                  type: 'string'
                }
              ],
              internalType: 'struct ProofConfig',
              name: 'proofs',
              type: 'tuple'
            }
          ],
          internalType: 'struct MarketplaceConfig',
          name: 'configuration',
          type: 'tuple'
        },
        {
          internalType: 'contract IERC20',
          name: 'token_',
          type: 'address'
        },
        {
          internalType: 'contract IGroth16Verifier',
          name: 'verifier',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'SlotId',
          name: 'id',
          type: 'bytes32'
        }
      ],
      name: 'ProofSubmitted',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        }
      ],
      name: 'RequestCancelled',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        }
      ],
      name: 'RequestFailed',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        }
      ],
      name: 'RequestFulfilled',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'slotIndex',
          type: 'uint256'
        }
      ],
      name: 'SlotFilled',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'slotIndex',
          type: 'uint256'
        }
      ],
      name: 'SlotFreed',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        },
        {
          components: [
            {
              internalType: 'uint64',
              name: 'slots',
              type: 'uint64'
            },
            {
              internalType: 'uint256',
              name: 'slotSize',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'duration',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'proofProbability',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'reward',
              type: 'uint256'
            },
            {
              internalType: 'uint256',
              name: 'collateral',
              type: 'uint256'
            },
            {
              internalType: 'uint64',
              name: 'maxSlotLoss',
              type: 'uint64'
            }
          ],
          indexed: false,
          internalType: 'struct Ask',
          name: 'ask',
          type: 'tuple'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'expiry',
          type: 'uint256'
        }
      ],
      name: 'StorageRequested',
      type: 'event'
    },
    {
      inputs: [],
      name: 'config',
      outputs: [
        {
          components: [
            {
              components: [
                {
                  internalType: 'uint8',
                  name: 'repairRewardPercentage',
                  type: 'uint8'
                },
                {
                  internalType: 'uint8',
                  name: 'maxNumberOfSlashes',
                  type: 'uint8'
                },
                {
                  internalType: 'uint16',
                  name: 'slashCriterion',
                  type: 'uint16'
                },
                {
                  internalType: 'uint8',
                  name: 'slashPercentage',
                  type: 'uint8'
                }
              ],
              internalType: 'struct CollateralConfig',
              name: 'collateral',
              type: 'tuple'
            },
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'period',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'timeout',
                  type: 'uint256'
                },
                {
                  internalType: 'uint8',
                  name: 'downtime',
                  type: 'uint8'
                },
                {
                  internalType: 'string',
                  name: 'zkeyHash',
                  type: 'string'
                }
              ],
              internalType: 'struct ProofConfig',
              name: 'proofs',
              type: 'tuple'
            }
          ],
          internalType: 'struct MarketplaceConfig',
          name: '',
          type: 'tuple'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        },
        {
          internalType: 'uint256',
          name: 'slotIndex',
          type: 'uint256'
        },
        {
          components: [
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'x',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'y',
                  type: 'uint256'
                }
              ],
              internalType: 'struct G1Point',
              name: 'a',
              type: 'tuple'
            },
            {
              components: [
                {
                  components: [
                    {
                      internalType: 'uint256',
                      name: 'real',
                      type: 'uint256'
                    },
                    {
                      internalType: 'uint256',
                      name: 'imag',
                      type: 'uint256'
                    }
                  ],
                  internalType: 'struct Fp2Element',
                  name: 'x',
                  type: 'tuple'
                },
                {
                  components: [
                    {
                      internalType: 'uint256',
                      name: 'real',
                      type: 'uint256'
                    },
                    {
                      internalType: 'uint256',
                      name: 'imag',
                      type: 'uint256'
                    }
                  ],
                  internalType: 'struct Fp2Element',
                  name: 'y',
                  type: 'tuple'
                }
              ],
              internalType: 'struct G2Point',
              name: 'b',
              type: 'tuple'
            },
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'x',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'y',
                  type: 'uint256'
                }
              ],
              internalType: 'struct G1Point',
              name: 'c',
              type: 'tuple'
            }
          ],
          internalType: 'struct Groth16Proof',
          name: 'proof',
          type: 'tuple'
        }
      ],
      name: 'fillSlot',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'slotId',
          type: 'bytes32'
        }
      ],
      name: 'freeSlot',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'slotId',
          type: 'bytes32'
        }
      ],
      name: 'getActiveSlot',
      outputs: [
        {
          components: [
            {
              components: [
                {
                  internalType: 'address',
                  name: 'client',
                  type: 'address'
                },
                {
                  components: [
                    {
                      internalType: 'uint64',
                      name: 'slots',
                      type: 'uint64'
                    },
                    {
                      internalType: 'uint256',
                      name: 'slotSize',
                      type: 'uint256'
                    },
                    {
                      internalType: 'uint256',
                      name: 'duration',
                      type: 'uint256'
                    },
                    {
                      internalType: 'uint256',
                      name: 'proofProbability',
                      type: 'uint256'
                    },
                    {
                      internalType: 'uint256',
                      name: 'reward',
                      type: 'uint256'
                    },
                    {
                      internalType: 'uint256',
                      name: 'collateral',
                      type: 'uint256'
                    },
                    {
                      internalType: 'uint64',
                      name: 'maxSlotLoss',
                      type: 'uint64'
                    }
                  ],
                  internalType: 'struct Ask',
                  name: 'ask',
                  type: 'tuple'
                },
                {
                  components: [
                    {
                      internalType: 'string',
                      name: 'cid',
                      type: 'string'
                    },
                    {
                      internalType: 'bytes32',
                      name: 'merkleRoot',
                      type: 'bytes32'
                    }
                  ],
                  internalType: 'struct Content',
                  name: 'content',
                  type: 'tuple'
                },
                {
                  internalType: 'uint256',
                  name: 'expiry',
                  type: 'uint256'
                },
                {
                  internalType: 'bytes32',
                  name: 'nonce',
                  type: 'bytes32'
                }
              ],
              internalType: 'struct Request',
              name: 'request',
              type: 'tuple'
            },
            {
              internalType: 'uint256',
              name: 'slotIndex',
              type: 'uint256'
            }
          ],
          internalType: 'struct Marketplace.ActiveSlot',
          name: '',
          type: 'tuple'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'id',
          type: 'bytes32'
        }
      ],
      name: 'getChallenge',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'slotId',
          type: 'bytes32'
        }
      ],
      name: 'getHost',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'id',
          type: 'bytes32'
        }
      ],
      name: 'getPointer',
      outputs: [
        {
          internalType: 'uint8',
          name: '',
          type: 'uint8'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        }
      ],
      name: 'getRequest',
      outputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'client',
              type: 'address'
            },
            {
              components: [
                {
                  internalType: 'uint64',
                  name: 'slots',
                  type: 'uint64'
                },
                {
                  internalType: 'uint256',
                  name: 'slotSize',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'duration',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'proofProbability',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'reward',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'collateral',
                  type: 'uint256'
                },
                {
                  internalType: 'uint64',
                  name: 'maxSlotLoss',
                  type: 'uint64'
                }
              ],
              internalType: 'struct Ask',
              name: 'ask',
              type: 'tuple'
            },
            {
              components: [
                {
                  internalType: 'string',
                  name: 'cid',
                  type: 'string'
                },
                {
                  internalType: 'bytes32',
                  name: 'merkleRoot',
                  type: 'bytes32'
                }
              ],
              internalType: 'struct Content',
              name: 'content',
              type: 'tuple'
            },
            {
              internalType: 'uint256',
              name: 'expiry',
              type: 'uint256'
            },
            {
              internalType: 'bytes32',
              name: 'nonce',
              type: 'bytes32'
            }
          ],
          internalType: 'struct Request',
          name: '',
          type: 'tuple'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'id',
          type: 'bytes32'
        }
      ],
      name: 'isProofRequired',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'slotId',
          type: 'bytes32'
        },
        {
          internalType: 'Periods.Period',
          name: 'period',
          type: 'uint256'
        }
      ],
      name: 'markProofAsMissing',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'slotId',
          type: 'bytes32'
        }
      ],
      name: 'missingProofs',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'myRequests',
      outputs: [
        {
          internalType: 'RequestId[]',
          name: '',
          type: 'bytes32[]'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'mySlots',
      outputs: [
        {
          internalType: 'SlotId[]',
          name: '',
          type: 'bytes32[]'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        }
      ],
      name: 'requestEnd',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        }
      ],
      name: 'requestExpiry',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        }
      ],
      name: 'requestState',
      outputs: [
        {
          internalType: 'enum RequestState',
          name: '',
          type: 'uint8'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'client',
              type: 'address'
            },
            {
              components: [
                {
                  internalType: 'uint64',
                  name: 'slots',
                  type: 'uint64'
                },
                {
                  internalType: 'uint256',
                  name: 'slotSize',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'duration',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'proofProbability',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'reward',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'collateral',
                  type: 'uint256'
                },
                {
                  internalType: 'uint64',
                  name: 'maxSlotLoss',
                  type: 'uint64'
                }
              ],
              internalType: 'struct Ask',
              name: 'ask',
              type: 'tuple'
            },
            {
              components: [
                {
                  internalType: 'string',
                  name: 'cid',
                  type: 'string'
                },
                {
                  internalType: 'bytes32',
                  name: 'merkleRoot',
                  type: 'bytes32'
                }
              ],
              internalType: 'struct Content',
              name: 'content',
              type: 'tuple'
            },
            {
              internalType: 'uint256',
              name: 'expiry',
              type: 'uint256'
            },
            {
              internalType: 'bytes32',
              name: 'nonce',
              type: 'bytes32'
            }
          ],
          internalType: 'struct Request',
          name: 'request',
          type: 'tuple'
        }
      ],
      name: 'requestStorage',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'slotId',
          type: 'bytes32'
        }
      ],
      name: 'slotState',
      outputs: [
        {
          internalType: 'enum SlotState',
          name: '',
          type: 'uint8'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'id',
          type: 'bytes32'
        },
        {
          components: [
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'x',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'y',
                  type: 'uint256'
                }
              ],
              internalType: 'struct G1Point',
              name: 'a',
              type: 'tuple'
            },
            {
              components: [
                {
                  components: [
                    {
                      internalType: 'uint256',
                      name: 'real',
                      type: 'uint256'
                    },
                    {
                      internalType: 'uint256',
                      name: 'imag',
                      type: 'uint256'
                    }
                  ],
                  internalType: 'struct Fp2Element',
                  name: 'x',
                  type: 'tuple'
                },
                {
                  components: [
                    {
                      internalType: 'uint256',
                      name: 'real',
                      type: 'uint256'
                    },
                    {
                      internalType: 'uint256',
                      name: 'imag',
                      type: 'uint256'
                    }
                  ],
                  internalType: 'struct Fp2Element',
                  name: 'y',
                  type: 'tuple'
                }
              ],
              internalType: 'struct G2Point',
              name: 'b',
              type: 'tuple'
            },
            {
              components: [
                {
                  internalType: 'uint256',
                  name: 'x',
                  type: 'uint256'
                },
                {
                  internalType: 'uint256',
                  name: 'y',
                  type: 'uint256'
                }
              ],
              internalType: 'struct G1Point',
              name: 'c',
              type: 'tuple'
            }
          ],
          internalType: 'struct Groth16Proof',
          name: 'proof',
          type: 'tuple'
        }
      ],
      name: 'submitProof',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'token',
      outputs: [
        {
          internalType: 'contract IERC20',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'SlotId',
          name: 'id',
          type: 'bytes32'
        }
      ],
      name: 'willProofBeRequired',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'RequestId',
          name: 'requestId',
          type: 'bytes32'
        }
      ],
      name: 'withdrawFunds',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ],
  address: ENV.marketplaceAddress
})
app.use(testTokenPlugin, {
  abi: [
    {
      inputs: [],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'spender',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        }
      ],
      name: 'Approval',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'from',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'value',
          type: 'uint256'
        }
      ],
      name: 'Transfer',
      type: 'event'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'spender',
          type: 'address'
        }
      ],
      name: 'allowance',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'spender',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      name: 'approve',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address'
        }
      ],
      name: 'balanceOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'decimals',
      outputs: [
        {
          internalType: 'uint8',
          name: '',
          type: 'uint8'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'spender',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'subtractedValue',
          type: 'uint256'
        }
      ],
      name: 'decreaseAllowance',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'spender',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'addedValue',
          type: 'uint256'
        }
      ],
      name: 'increaseAllowance',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'holder',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'name',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'symbol',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'totalSupply',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      name: 'transfer',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256'
        }
      ],
      name: 'transferFrom',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ],
  address: ENV.testTokenAddress
})
app.use(codexPlugin, {
  codexRestUrl: ENV.codexRestUrl,
  myAddress: ENV.myAddress
})
app.use(uniqueId)
app.mount('#app')
