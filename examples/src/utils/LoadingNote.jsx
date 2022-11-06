import { Html } from "@react-three/drei";
import styled from "styled-components";

const LoadingNoteBox = styled(Html)`
  & > div {
    display: inline-block;
    padding: 10px 15px;
    border-radius: 4px;
    background-color: #372948;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    white-space: nowrap;
    transform: translateX(-50%) translateY(-50%);
    user-select: none;
    pointer-events: none;
    text-align: center;

    & > :nth-child(2) {
      font-size: 12px;
      opacity: 0.5;
      margin-top: 8px;
    }
  }
`;

export const LoadingNote = () => (
  <LoadingNoteBox>
    <div>
      <div>
        Loading...
      </div>
      <div>
        (Note: Downloading a VDB file. ~70MB. Please wait.)
      </div>
    </div>
  </LoadingNoteBox>
);