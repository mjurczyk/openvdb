import { useState, createContext } from "react";

export const VDBUploadContext = createContext({
  vdbFile: null,
  showVDBUpload: false
});

export const VDBUploadContextProvider = (props) => {
  const [ vdbFile, setVDBFile ] = useState(null);
  const [ showVDBUpload, setShowVDBUpload ] = useState(false);

  return (
    <VDBUploadContext.Provider
      value={{
        vdbFile,
        setVDBFile,
        showVDBUpload,
        setShowVDBUpload
      }}
    >
      {props.children}
    </VDBUploadContext.Provider>
  );
};

