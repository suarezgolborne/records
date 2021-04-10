import styled, { keyframes, css } from "styled-components";
import { motion } from "framer-motion";

export const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`;

// Create the keyframes
const fade = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const animationMixin = (props) =>
  props.updating &&
  css`
    ${fade} 0.5s linear forwards
  `;

export const BgContainer = styled.div`
  opacity: 1;
  animation: ${animationMixin};
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: -1;
`;

export const BgImage = styled(motion.div)`
background-size: cover;
  background-position: 50% 0;
  background-repeat: no-repeat;
  overflow: hidden;
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: -1;
  will-change: opacity;  
  filter: grayscale(1) brightness(0.45) contrast(1.3);
  background-image: ${(props) => props.BgImage && `url(${props.BgImage})`} 
  
  
}

`;

export const CoverImage = styled(motion.img)`
  width: 100%;
  object-fit: contain;

  @media (min-width: 520px) {
    width: 35vw;
  }
`;

/* background-color: ${(props) => props.bgColor}  */
/* background-color: ${(props) =>
  props.bgColor &&
  `rgba(${props.bgColor[0]},${props.bgColor[1]},${props.bgColor[2]},0.6)`}  */

export const BgTint = styled(motion.div)`
  background-size: cover;
  /* background-color: #46472ed9; */
  opacity: 1;
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
  width: calc(100% - 40px);
  height: calc(100% - 40px);
  border: 20px solid #ddffddba;
  border: 20px solid #ffffff80;
  filter: contrast(2.3) brightness(0.7);

  background-color: ${(props) => props.bgColor}
  
}

`;

// Here we create a component that will rotate everything we pass in over two seconds
/* const Rotate = styled.div`
  display: inline-block;
  animation: ${rotate} 2s linear infinite;
  padding: 2rem 1rem;
  font-size: 1.2rem;
`; */
