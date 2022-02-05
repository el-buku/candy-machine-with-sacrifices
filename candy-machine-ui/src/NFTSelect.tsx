import { Box, CircularProgress } from "@material-ui/core";
import React, { PropsWithChildren, useState, useEffect } from "react";
import { NFTOption } from "./Home";
import { MetadataJSON } from "./utils";

const Selected = () => {
  return (
    <div className={"check"}>
      <span>&#10003;</span>
    </div>
  );
};
const CircularIndeterminate = () => {
  return (
    <Box
      sx={{
        display: "flex",
        height: 180,
        width: 180,
        justifyContent: "center",
        alignItems: "center ",
      }}
    >
      <CircularProgress />
    </Box>
  );
};

const NFTImage = ({ metadataURI }: { metadataURI: string }) => {
  const [imgURI, setImgURI] = useState<string | undefined>("");
  const [metadata, setMetadata] = useState<MetadataJSON>();
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const getImgURI = async () => {
      const metadata: MetadataJSON = await (await fetch(metadataURI)).json();
      const imgURI = metadata?.properties?.files?.[0].uri || "";
      return { metadata, imgURI };
    };
    getImgURI().then(({ metadata, imgURI }) => {
      setMetadata(metadata);
      setImgURI(imgURI);
      setLoading(false);
    });
  }, []);
  // console.log(imgURI, metadata);
  return !loading && imgURI !== "" ? (
    <img src={imgURI} height={180} width={180} onError={() => setImgURI("")} />
  ) : (
    <CircularIndeterminate />
  );
};

const NFTOptionBox = ({
  opt,
  selected,
  onClick,
}: {
  opt: NFTOption;
  selected: boolean;
  onClick: () => void;
}) => {
  // console.log(opt);

  return (
    <a onClick={onClick}>
      <div>
        <style>
          {`
        .selected{
          border: 5px #604ae5 solid;
          border-radius: 5px;
          position:relative
        }
        .selected .check{
          position:absolute;
          background-color:#604ae5;
          bottom:-2px;
          right:0;
          width:20px;
          margin-right: -2px;
          text-align: center;
          color:white;
          border-radius:2px
        }
        .hover{
          border: 5px transparent solid;
        }
        .hover:hover{
          border: 5px lightgray solid;
          border-radius: 5px;
        }
        `}
        </style>
        <div
          className={selected ? "selected" : "hover"}
          style={{
            width: 180,
            paddingBottom: 10,
          }}
        >
          <NFTImage metadataURI={opt.data.uri} />
          {selected && <Selected />}
        </div>
        <h4 style={{ color: "white" }}>{opt.data.name}</h4>
      </div>
    </a>
  );
};

export interface SelectProps {
  onChange: (nfts: NFTOption[]) => void;
  options: NFTOption[];
  selected: NFTOption[];
  selectionLimit: 2;
}

const NFTSelect: React.FC<PropsWithChildren<SelectProps>> = ({
  onChange,
  options,
  selected,
  selectionLimit,
}) => {
  const handleClick = (id: number) => {
    const selectionFilter = selected.map((item, index) => item.id).includes(id);
    console.log(selectionFilter, selected, id);
    // const selectedIndex = selectionFilter?.[0];

    if (selectionFilter) {
      onChange(
        selected
          .map((item, index) => item.id !== id && item)
          .filter((n) => n) as NFTOption[]
      );
    } else {
      selected.push(options.find((item) => item.id === id)!);
      if (selected.length > selectionLimit) selected.splice(0, 1);
      onChange(selected);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, max-content))",
        gap: 16,
        justifyContent: "center",
        padding: "initial",
      }}
    >
      {options.map((opt, index) => (
        <NFTOptionBox
          onClick={() => handleClick(opt.id)}
          key={opt.id.toString().concat(index.toString())}
          {...{
            opt,
            selected:
              selected.find((s) => s.id === opt.id) !== undefined
                ? true
                : false,
          }}
        />
      ))}
    </div>
  );
};

export default NFTSelect;
