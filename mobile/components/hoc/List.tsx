import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  StyleSheet,
  View,
} from "react-native";
import { BreakdownBill, BreakdownIssue, BreakdownRep } from "../../types/api";

interface Props<T> extends FlatListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
}

function List<T extends BreakdownBill | BreakdownRep | BreakdownIssue>({
  data,
  renderItem,
  onRefresh,
  ...otherProps
}: Props<T>) {
  return (
    <View style={styles.container}>
      <FlatList
        onRefresh={onRefresh}
        data={data}
        renderItem={(item) => renderItem(item)}
        keyExtractor={(item) => item.id || ""}
        showsVerticalScrollIndicator={false}
        {...otherProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
  },
});

export default List;
