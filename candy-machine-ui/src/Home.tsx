import { useEffect, useMemo, useState, useCallback } from "react";
import * as anchor from "@project-serum/anchor";

import styled from "styled-components";
import {
  Box,
  Container,
  Grid,
  Modal,
  Snackbar,
  Typography,
} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import Alert from "@material-ui/lab/Alert";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";
import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM,
  getCandyMachineState,
  // mintOneToken,
  sacrificeAndMintOneToken,
} from "./candy-machine";
import { AlertState } from "./utils";
import { Header } from "./Header";
import { MintButton, CTAButton } from "./MintButton";
import { GatewayProvider } from "@civic/solana-gateway-react";
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";

import NFTSelect from "./NFTSelect";
import Multiselect from "multiselect-react-dropdown";

const ConnectButton = styled(WalletDialogButton)`
  width: 100%;
  height: 60px;
  margin-top: 10px;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const MintContainer = styled.div``; // add your owns styles here

export interface HomeProps {
  candyMachineId?: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  txTimeout: number;
  rpcHost: string;
}

export type ParsedNFT = Awaited<
  ReturnType<typeof getParsedNftAccountsByOwner>
>[0];

export type NFTOption = ParsedNFT & {
  id: number;
  name: string;
  symbol: string;
};

const Home = (props: HomeProps) => {
  const [isUserMinting, setIsUserMinting] = useState(false);
  const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();
  const [nfts, setNfts] = useState<ParsedNFT[]>([]);
  const [selectedNfts, setSelected] = useState<NFTOption[]>([]);
  console.log(selectedNfts);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  useEffect(() => setAccepted(false), [selectedNfts]);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const selectionLimit = 2;
  const rpcUrl = props.rpcHost;
  const wallet = useWallet();

  const anchorWallet = useMemo(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction
    ) {
      return;
    }
    //@ts-ignore
    window.wallet = wallet;
    return {
      publicKey: wallet.publicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    } as anchor.Wallet;
  }, [wallet]);
  useEffect(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction ||
      !candyMachine
    ) {
      return;
    }
    // console.log(wallet);
    getParsedNftAccountsByOwner({
      publicAddress: wallet.publicKey,
      connection: props.connection,
    }).then((nfts: ParsedNFT[]) => {
      const items: ParsedNFT[] = nfts.filter(
        (n: ParsedNFT) =>
          (n.data.symbol == candyMachine.state.sacrificedTokenSymbol ||
            !candyMachine.state.sacrificedTokenSymbol) &&
          n
      );

      // console.log(nfts, items);
      setNfts(items);
    });
  }, [wallet, props.connection, candyMachine]);

  const refreshCandyMachineState = useCallback(async () => {
    if (!anchorWallet) {
      return;
    }

    if (props.candyMachineId) {
      try {
        const cndy = await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection
        );
        setCandyMachine(cndy);
      } catch (e) {
        console.log("There was a problem fetching Candy Machine state");
        console.log(e);
      }
    }
  }, [anchorWallet, props.candyMachineId, props.connection]);

  const onMint = useCallback(async () => {
    if (accepted) {
      try {
        setIsUserMinting(true);
        document.getElementById("#identity")?.click();
        if (wallet.connected && candyMachine?.program && wallet.publicKey) {
          // const mintTxId = (
          //   await mintOneToken(candyMachine, wallet.publicKey)
          // )[0];
          const mintTxIds = await sacrificeAndMintOneToken(
            selectedNfts,
            candyMachine,
            anchorWallet!,
            props.txTimeout
          );
          const mintTxId = mintTxIds[mintTxIds.length - 1];
          console.log("mintTxId", mintTxId);
          let status: any = { err: true };
          if (mintTxId && mintTxId !== undefined) {
            status = await awaitTransactionSignatureConfirmation(
              mintTxId as any as string,
              props.txTimeout,
              props.connection,
              true
            );
          } else {
            setAlertState({
              open: true,
              message: "Sacrifice failed! Please try again!",
              severity: "error",
            });
          }
          console.log("status", status);
          if (status && !status.err) {
            setAlertState({
              open: true,
              message: "Congratulations! Mint succeeded!",
              severity: "success",
            });
          } else {
            setAlertState({
              open: true,
              message: "Mint failed! Please try again!",
              severity: "error",
            });
          }
        }
      } catch (error: any) {
        let message = error.msg || "Minting failed! Please try again!";
        if (!error.msg) {
          if (!error.message) {
            message = "Transaction Timeout! Please try again.";
          } else if (error.message.indexOf("0x137")) {
            message = `SOLD OUT!`;
          } else if (error.message.indexOf("0x135")) {
            message = `Insufficient funds to mint. Please fund your wallet.`;
          }
        } else {
          if (error.code === 311) {
            message = `SOLD OUT!`;
            window.location.reload();
          } else if (error.code === 312) {
            message = `Minting period hasn't started yet.`;
          }
        }

        setAlertState({
          open: true,
          message,
          severity: "error",
        });
      } finally {
        setIsUserMinting(false);
      }
    }
  }, [accepted, anchorWallet, candyMachine, props, wallet, selectedNfts]);

  useEffect(() => {
    refreshCandyMachineState();
  }, [
    anchorWallet,
    props.candyMachineId,
    props.connection,
    refreshCandyMachineState,
  ]);

  const nftOptions: NFTOption[] = nfts.map((n, id) => ({
    ...n,
    id,
    name: n?.data?.name,
    symbol: n?.data?.symbol,
  }));

  // console.log(nftOptions);
  // console.log(selectedNfts);

  return (
    <Container style={{ marginTop: 100 }}>
      <Container maxWidth="md" style={{ position: "relative" }}>
        {wallet && (
          <>
            <style>{`.option{color:black}`}</style>
            {/* <Grid
              container
              direction="column"
              justifyContent="center"
              wrap="nowrap"
            > */}
            <NFTSelect
              onChange={(l) => {
                console.log(l);
                setSelected([...l]);
              }}
              selectionLimit={selectionLimit}
              options={nftOptions}
              selected={selectedNfts}
            />
            {/* </Grid> */}
            <br />
          </>
        )}
        <Container maxWidth="xs" style={{ position: "relative" }}>
          <Paper
            style={{ padding: 24, backgroundColor: "#151A1F", borderRadius: 6 }}
          >
            {!wallet.connected ? (
              <ConnectButton>Connect Wallet</ConnectButton>
            ) : (
              <>
                <Header candyMachine={candyMachine} />
                <MintContainer>
                  {candyMachine?.state.isActive &&
                  candyMachine?.state.gatekeeper &&
                  wallet.publicKey &&
                  wallet.signTransaction ? (
                    <GatewayProvider
                      wallet={{
                        publicKey:
                          wallet.publicKey ||
                          new PublicKey(CANDY_MACHINE_PROGRAM),
                        //@ts-ignore
                        signTransaction: wallet.signTransaction,
                      }}
                      gatekeeperNetwork={
                        candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                      }
                      clusterUrl={rpcUrl}
                      options={{ autoShowModal: false }}
                    >
                      <MintButton
                        candyMachine={candyMachine}
                        isMinting={isUserMinting}
                        onMint={handleOpen}
                        disabled={selectedNfts.length < 2 ? true : false}
                      />
                    </GatewayProvider>
                  ) : (
                    <MintButton
                      candyMachine={candyMachine}
                      isMinting={isUserMinting}
                      onMint={handleOpen}
                      disabled={selectedNfts.length < 2 ? true : false}
                    />
                  )}
                </MintContainer>
              </>
            )}
          </Paper>
        </Container>
      </Container>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Paper
          style={{
            padding: 24,
            backgroundColor: "#151A1F",
            borderRadius: 6,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 250,
            border: "2px solid #000",
          }}
        >
          <Grid container direction="column">
            <Typography variant="h6" color="textSecondary">
              Are you sure ?
            </Typography>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <CTAButton
                onClick={() => {
                  setAccepted(true);
                  onMint();
                }}
                style={{ maxWidth: "45%" }}
              >
                Yes
              </CTAButton>
              <CTAButton
                onClick={handleClose}
                style={{
                  maxWidth: "45%",
                  background: "#384457",
                  color: "lightgray",
                }}
              >
                No
              </CTAButton>
            </div>
          </Grid>
        </Paper>
      </Modal>
      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home;
