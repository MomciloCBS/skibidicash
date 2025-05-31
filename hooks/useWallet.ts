// 🪙 hooks/useWallet.ts
import { useEffect, useState } from 'react';
import {
  BlockchainConfig,
  DescriptorSecretKey,
  Wallet,
  Network,
} from 'react-native-bdk';
import { SecureStorage } from '../services/SecureStorage';

export function useWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const mnemonic = await SecureStorage.getMnemonic();
        if (!mnemonic) return;

        const descriptorSecretKey = await DescriptorSecretKey.create(Network.TESTNET, mnemonic);
        const external = await descriptorSecretKey.derive("m/84'/1'/0'/0");
        const internal = await descriptorSecretKey.derive("m/84'/1'/0'/1");

        const descriptor = external.asString();
        const changeDescriptor = internal.asString();

        if (!descriptor || !changeDescriptor) throw new Error('Invalid descriptor strings');

        const blockchain = await BlockchainConfig.electrum(
          'ssl://electrum.blockstream.info:60002'
        );

        const w = await Wallet.create({
          descriptor,
          changeDescriptor,
          network: 'testnet',
          blockchain,
        });

        await w.sync(blockchain);
        const bal = await w.getBalance();
        const addr = await w.getAddress();

        setWallet(w);
        setBalance(bal.total);
        setAddress(addr.address);
      } catch (e) {
        console.error('Wallet init error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { wallet, address, balance, loading };
}