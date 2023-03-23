import { useRef } from "react";
import { Dimensions } from "react-native";
import Carousel from "react-native-snap-carousel";
import BillCard from "../BillCard";

interface CarouselProps {
  renderItem: (item: any) => JSX.Element;
  data: any[];
}

const BreakdownCarousel = ({ renderItem, data }: CarouselProps) => {
  const carouselRef = useRef();
  const width = Dimensions.get("window").width;
  return (
    <Carousel
      layout={"default"}
      ref={carouselRef}
      data={data}
      sliderWidth={width}
      itemWidth={width * 0.9}
      renderItem={renderItem}
      onSnapToItem={(index) => {
        // TODO: Set bill seen
      }}
    />
  );
};

export default BreakdownCarousel;
