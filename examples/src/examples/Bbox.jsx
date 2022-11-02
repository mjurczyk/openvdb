import { useEffect, useState } from "react";
import { VDBLoader } from "../../../src/openvdb/three";
import { VDBPreview } from "../utils/VDBPreview";

export const Bbox = () => {
  const [vdbSource, setVdbSource] = useState(null);

  useEffect(() => {
    new VDBLoader().load('./assets/bunny_cloud.vdb', (vdb) => {
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
      <VDBPreview
        vdbSource={vdbSource}
        renderType="boundingBox"
      />
    </>
  );
};
