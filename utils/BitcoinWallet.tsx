// // utils/BitcoinWallet.ts
// import * as bitcoin from 'bitcoinjs-lib';
// import * as bip39 from 'bip39';
// import { BIP32Factory } from 'bip32';
// import * as ecc from '@noble/secp256k1';
// import 'react-native-get-random-values'; // Must be imported before other crypto

// // Initialize BIP32 with elliptic curve cryptography
// const bip32 = BIP32Factory({
//   isPoint: (p: Uint8Array): boolean => {
//     try {
//       return ecc.Point.fromHex(Buffer.from(p).toString('hex')) !== null;
//     } catch {
//       return false;
//     }
//   },
//   isPrivate: (d: Uint8Array): boolean => {
//     return ecc.utils.isValidPrivateKey(d);
//   },
//   pointFromScalar: (d: Uint8Array, compressed?: boolean): Uint8Array | null => {
//     try {
//       const point = ecc.getPublicKey(d, compressed);
//       return new Uint8Array(point);
//     } catch {
//       return null;
//     }
//   },
//   pointAddScalar: (p: Uint8Array, tweak: Uint8Array, compressed?: boolean): Uint8Array | null => {
//     try {
//       const point = ecc.Point.fromHex(Buffer.from(p).toString('hex'));
//       const tweaked = point.add(ecc.Point.fromPrivateKey(tweak));
//       return new Uint8Array(tweaked.toRawBytes(compressed));
//     } catch {
//       return null;
//     }
//   },
//   privateAdd: (d: Uint8Array, tweak: Uint8Array): Uint8Array | null => {
//     try {
//       const result = ecc.utils.privateAdd(d, tweak);
//       return result ? new Uint8Array(result) : null;
//     } catch {
//       return null;
//     }
//   },
//   sign: (h: Uint8Array, d: Uint8Array): Uint8Array => {
//     const signature = ecc.sign(h, d);
//     return new Uint8Array(signature);
//   },
//   verify: (h: Uint8Array, Q: Uint8Array, signature: Uint8Array): boolean => {
//     try {
//       return ecc.verify(signature, h, Q);
//     } catch {
//       return false;
//     }
//   }
// });

// export interface BitcoinWalletData {
//   mnemonic: string;
//   privateKey: string;
//   publicKey: string;
//   paymentsAddress: string; // P2WPKH (bc1q...)
//   ordinalsAddress: string; // P2TR (bc1p...)
//   fingerprint: string;
// }

// export class BitcoinWalletGenerator {
//   private static network = bitcoin.networks.bitcoin; // Use bitcoin.networks.testnet for testing

//   /**
//    * Generate a new Bitcoin wallet with mnemonic, keys, and addresses
//    */
//   static generateWallet(): BitcoinWalletData {
//     try {
//       // Generate random mnemonic (12 words)
//       const mnemonic = bip39.generateMnemonic(128);
      
//       // Convert mnemonic to seed
//       const seed = bip39.mnemonicToSeedSync(mnemonic);
      
//       // Create HD wallet root
//       const root = bip32.fromSeed(Buffer.from(seed) as Buffer, this.network);
      
//       // Derive payment key (P2WPKH) - BIP84: m/84'/0'/0'/0/0
//       const paymentPath = "m/84'/0'/0'/0/0";
//       const paymentKey = root.derivePath(paymentPath);
      
//       // Derive ordinals key (P2TR) - BIP86: m/86'/0'/0'/0/0
//       const ordinalsPath = "m/86'/0'/0'/0/0";
//       const ordinalsKey = root.derivePath(ordinalsPath);
      
//       // Generate P2WPKH address (native segwit - starts with bc1q)
//       const { address: paymentsAddress } = bitcoin.payments.p2wpkh({
//         pubkey: Buffer.from(paymentKey.publicKey) as Buffer,
//         network: this.network,
//       });
      
//       // Generate P2TR address (taproot - starts with bc1p)
//       const { address: ordinalsAddress } = bitcoin.payments.p2tr({
//         internalPubkey: Buffer.from(ordinalsKey.publicKey.subarray(1, 33)) as Buffer, // Remove prefix byte
//         network: this.network,
//       });
      
//       if (!paymentsAddress || !ordinalsAddress) {
//         throw new Error('Failed to generate Bitcoin addresses');
//       }
      
//       return {
//         mnemonic,
//         privateKey: paymentKey.toWIF(),
//         publicKey: Buffer.from(paymentKey.publicKey).toString('hex'),
//         paymentsAddress,
//         ordinalsAddress,
//         fingerprint: Buffer.from(root.fingerprint).toString('hex'),
//       };
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       console.error('Error generating wallet:', error);
//       throw new Error(`Failed to generate wallet: ${errorMessage}`);
//     }
//   }

//   /**
//    * Restore wallet from mnemonic
//    */
//   static restoreFromMnemonic(mnemonic: string): BitcoinWalletData {
//     try {
//       const cleanMnemonic = mnemonic.trim().toLowerCase();
      
//       if (!bip39.validateMnemonic(cleanMnemonic)) {
//         throw new Error('Invalid mnemonic phrase');
//       }
      
//       const seed = bip39.mnemonicToSeedSync(cleanMnemonic);
//       const root = bip32.fromSeed(Buffer.from(seed) as Buffer, this.network);
      
//       const paymentKey = root.derivePath("m/84'/0'/0'/0/0");
//       const ordinalsKey = root.derivePath("m/86'/0'/0'/0/0");
      
//       const { address: paymentsAddress } = bitcoin.payments.p2wpkh({
//         pubkey: Buffer.from(paymentKey.publicKey) as Buffer,
//         network: this.network,
//       });
      
//       const { address: ordinalsAddress } = bitcoin.payments.p2tr({
//         internalPubkey: Buffer.from(ordinalsKey.publicKey.subarray(1, 33)) as Buffer,
//         network: this.network,
//       });
      
//       if (!paymentsAddress || !ordinalsAddress) {
//         throw new Error('Failed to restore Bitcoin addresses');
//       }
      
//       return {
//         mnemonic: cleanMnemonic,
//         privateKey: paymentKey.toWIF(),
//         publicKey: Buffer.from(paymentKey.publicKey).toString('hex'),
//         paymentsAddress,
//         ordinalsAddress,
//         fingerprint: Buffer.from(root.fingerprint).toString('hex'),
//       };
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       console.error('Error restoring wallet:', error);
//       throw new Error(`Failed to restore wallet: ${errorMessage}`);
//     }
//   }

//   /**
//    * Validate Bitcoin address
//    */
//   static validateAddress(address: string): boolean {
//     try {
//       bitcoin.address.toOutputScript(address, this.network);
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   /**
//    * Generate multiple addresses for account discovery
//    */
//   static generateAddresses(mnemonic: string, count: number = 10): {
//     payments: string[];
//     ordinals: string[];
//   } {
//     try {
//       const seed = bip39.mnemonicToSeedSync(mnemonic);
//       const root = bip32.fromSeed(Buffer.from(seed) as Buffer, this.network);
      
//       const payments: string[] = [];
//       const ordinals: string[] = [];
      
//       for (let i = 0; i < count; i++) {
//         // Payment addresses
//         const paymentKey = root.derivePath(`m/84'/0'/0'/0/${i}`);
//         const { address: paymentAddr } = bitcoin.payments.p2wpkh({
//           pubkey: Buffer.from(paymentKey.publicKey) as Buffer,
//           network: this.network,
//         });
//         if (paymentAddr) payments.push(paymentAddr);
        
//         // Ordinals addresses
//         const ordinalsKey = root.derivePath(`m/86'/0'/0'/0/${i}`);
//         const { address: ordinalsAddr } = bitcoin.payments.p2tr({
//           internalPubkey: Buffer.from(ordinalsKey.publicKey.subarray(1, 33)) as Buffer,
//           network: this.network,
//         });
//         if (ordinalsAddr) ordinals.push(ordinalsAddr);
//       }
      
//       return { payments, ordinals };
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       console.error('Error generating addresses:', error);
//       throw new Error(`Failed to generate addresses: ${errorMessage}`);
//     }
//   }

//   /**
//    * Switch to testnet for development
//    */
//   static useTestnet(): void {
//     this.network = bitcoin.networks.testnet;
//   }

//   /**
//    * Switch to mainnet for production
//    */
//   static useMainnet(): void {
//     this.network = bitcoin.networks.bitcoin;
//   }
// }