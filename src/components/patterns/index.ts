// Shared page-building primitives. Prefer these over per-page bespoke versions
// so headers, stat cards, sections, tables, and pills stay visually consistent.
export { Button } from "./Button";
export { Tabs } from "./Tabs";
export type { TabItem } from "./Tabs";
export { FilterSelect } from "./FilterSelect";
export type { FilterOption } from "./FilterSelect";
export { DateRangeFilter } from "./DateRangeFilter";
export { PageHeader } from "./PageHeader";
export { StatCard, StatGrid } from "./StatCard";
export { SectionCard } from "./SectionCard";
export { Pill } from "./Pill";
export {
  Table,
  TableCard,
  TableToolbar,
  TablePagination,
  THead,
  Tr,
  Th,
  Td,
  EmptyRow,
  DataTable,
} from "./DataTable";
export type { Column, TablePaginationProps, TableToolbarProps } from "./DataTable";
