import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from "react-native";
import {
  Searchbar,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { getTemplates } from "../../lib/db";
import type { WorkoutTemplate } from "../../lib/types";

const ITEM_HEIGHT = 64;

export default function PickTemplate() {
  const theme = useTheme();
  const router = useRouter();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => t.name.toLowerCase().includes(q));
  }, [templates, query]);

  const pick = useCallback(
    (tpl: WorkoutTemplate) => {
      if (programId) {
        router.replace(
          `/program/create?programId=${programId}&addTemplateId=${tpl.id}`
        );
      } else {
        router.back();
      }
    },
    [programId, router]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<WorkoutTemplate>) => (
      <TouchableRipple
        onPress={() => pick(item)}
        style={[
          styles.item,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outlineVariant,
          },
        ]}
        accessibilityLabel={`Select template: ${item.name}`}
        accessibilityRole="button"
      >
        <View>
          <Text
            variant="titleSmall"
            numberOfLines={1}
            style={{ color: theme.colors.onSurface }}
          >
            {item.name}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Created {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableRipple>
    ),
    [theme, pick]
  );

  return (
    <>
      <Stack.Screen options={{ title: "Pick Template" }} />
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Searchbar
          placeholder="Search templates..."
          value={query}
          onChangeText={setQuery}
          style={[styles.search, { backgroundColor: theme.colors.surface }]}
          accessibilityLabel="Search templates"
        />
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          ListEmptyComponent={
            loading ? null : (
              <View style={styles.empty}>
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {templates.length === 0
                    ? "No templates yet. Create one first."
                    : "No matching templates"}
                </Text>
              </View>
            )
          }
          contentContainerStyle={
            filtered.length === 0 ? styles.emptyList : undefined
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  search: {
    margin: 12,
    marginBottom: 4,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: ITEM_HEIGHT,
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 48,
  },
  emptyList: {
    flexGrow: 1,
  },
});
