import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  StyleSheet,
  View,
} from "react-native";
import { BreakdownBill } from "../../types/api";

// TODO: Genericize this
interface Props extends FlatListProps<BreakdownBill> {
  data: BreakdownBill[];
  renderItem: ListRenderItem<BreakdownBill>;
}

const List = ({ data, renderItem, onRefresh, ...otherProps }: Props) => {
  return (
    <View style={styles.container}>
      <FlatList
        onRefresh={onRefresh}
        data={data}
        renderItem={(item) => renderItem(item)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        {...otherProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
  },
});

export default List;
