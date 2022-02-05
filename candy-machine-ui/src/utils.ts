import * as anchor from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import {
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";

export interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

export const toDate = (value?: anchor.BN) => {
  if (!value) {
    return;
  }

  return new Date(value.toNumber() * 1000);
};

const numberFormater = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatNumber = {
  format: (val?: number) => {
    if (!val) {
      return "--";
    }

    return numberFormater.format(val);
  },
  asNumber: (val?: anchor.BN) => {
    if (!val) {
      return undefined;
    }

    return val.toNumber() / LAMPORTS_PER_SOL;
  },
};

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID =
  new anchor.web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export const CIVIC = new anchor.web3.PublicKey(
  "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
);

export const getAtaForMint = async (
  mint: anchor.web3.PublicKey,
  buyer: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [buyer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
  );
};

export const getNetworkExpire = async (
  gatekeeperNetwork: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [gatekeeperNetwork.toBuffer(), Buffer.from("expire")],
    CIVIC
  );
};

export const getNetworkToken = async (
  wallet: anchor.web3.PublicKey,
  gatekeeperNetwork: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [
      wallet.toBuffer(),
      Buffer.from("gateway"),
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
      gatekeeperNetwork.toBuffer(),
    ],
    CIVIC
  );
};

export function createAssociatedTokenAccountInstruction(
  associatedTokenAddress: anchor.web3.PublicKey,
  payer: anchor.web3.PublicKey,
  walletAddress: anchor.web3.PublicKey,
  splTokenMintAddress: anchor.web3.PublicKey
) {
  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: walletAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: splTokenMintAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    data: Buffer.from([]),
  });
}

const metadataExample = {
  name: "Living Dead Ted G1-297",
  symbol: "LDTG1",
  description:
    "A collection of 666 algorithmically generated characters combining 193 unique traits with varying rarity across categories.",
  seller_fee_basis_points: 750,
  external_url: "https://livingdeadteds.com",
  image: "https://arweave.net/6YUvmO3AFdul6Z1caSkeHyg5f-PEIwaJ0viPcpGaZCc",
  attributes: [
    {
      trait_type: "Background",
      value: "Gradient-BG-6",
    },
    {
      trait_type: "Wings",
      value: "None",
    },
    {
      trait_type: "Left Side",
      value: "Old Lavender",
    },
    {
      trait_type: "Weapon",
      value: "None",
    },
    {
      trait_type: "Body",
      value: "Baby Blue Eyes",
    },
    {
      trait_type: "Belly",
      value: "Khaki Web",
    },
    {
      trait_type: "Accessory",
      value: "Ammo - Gold",
    },
    {
      trait_type: "Right Side",
      value: "Old Lavender",
    },
    {
      trait_type: "Head",
      value: "Sage",
    },
    {
      trait_type: "Ears",
      value: "Old Lavender",
    },
    {
      trait_type: "Eyes",
      value: "Eyes 6 - Yellow Red",
    },
    {
      trait_type: "Headwear",
      value: "None",
    },
    {
      trait_type: "Eyewear",
      value: "None",
    },
    {
      trait_type: "Mouth",
      value: "Mouth 2",
    },
    {
      trait_type: "Mask",
      value: "None",
    },
    {
      trait_type: "Frame",
      value: "Black",
    },
  ],
  collection: {
    name: "Living Dead Teds - Gen 1",
    family: "Living Dead Teds",
  },
  properties: {
    category: "image",
    files: [
      {
        type: "image/png",
        uri: "https://arweave.net/6YUvmO3AFdul6Z1caSkeHyg5f-PEIwaJ0viPcpGaZCc",
      },
    ],
    creators: [
      {
        address: "LDTV526tuJnEVyuXUtR9ScDbYxxcxbkmQhBQMRdusP3",
        share: 100,
      },
    ],
  },
};

export type MetadataJSON = typeof metadataExample;
