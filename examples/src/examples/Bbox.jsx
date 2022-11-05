import { useEffect, useState } from "react";
import * as OpenVDB from "../../../src/openvdb/three";
import { DebugScene } from "../utils/DebugScene";
import { VDBPreview } from "../utils/VDBPreview";

export const Bbox = () => {
  const [vdbSource, setVdbSource] = useState(null);

  useEffect(() => {
    new OpenVDB.VDBLoader().load('./assets/bunny_cloud.vdb', (vdb) => {
      setVdbSource(vdb);
    }, null, () => {
      alert('Could not load the VDB file.');
    });
  }, []);

  if (!vdbSource) {
    return null;
  }

  return (
    <>
      <DebugScene />
      <VDBPreview
        vdbSource={vdbSource}
        renderType="boundingBox"
      />
    </>
  );
};
