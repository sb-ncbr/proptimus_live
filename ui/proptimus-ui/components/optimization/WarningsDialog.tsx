"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/common/Button";
import { AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import type {
  Warnings,
  ResidueWarning,
  InteractionWarning,
} from "@/lib/molstar/types";
import { cn } from "@/lib/utils";

// Pagination constants
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

// Table state type for persistence
interface TableState {
  sorting: SortingState;
  pagination: PaginationState;
  globalFilter: string;
}

// Default table state factory
const createDefaultTableState = (): TableState => ({
  sorting: [],
  pagination: {
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  },
  globalFilter: "",
});

// Persisted state for all tabs
interface PersistedState {
  activeTab: string;
  repairTable: TableState;
  optimisationTable: TableState;
  interactionsTable: TableState;
}

const createDefaultPersistedState = (): PersistedState => ({
  activeTab: "repair",
  repairTable: createDefaultTableState(),
  optimisationTable: createDefaultTableState(),
  interactionsTable: createDefaultTableState(),
});

// Highlight matching text helper
function HighlightText({ text, search }: { text: string | number; search: string }) {
  if (!search.trim()) {
    return <>{text}</>;
  }

  const textStr = String(text);
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = textStr.split(regex);

  if (parts.length === 1) {
    return <>{text}</>;
  }

  return (
    <span className="contents">
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// Pagination Controls Component
interface PaginationControlsProps {
  table: ReturnType<typeof useReactTable<any>>;
}

function PaginationControls({ table }: PaginationControlsProps) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const pageCount = table.getPageCount();
  const rowCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex items-center justify-between px-2 py-2 border-t bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {pageIndex * pageSize + 1}-
          {Math.min((pageIndex + 1) * pageSize, rowCount)} of {rowCount}
        </span>
        <span className="hidden sm:inline">|</span>
        <div className="hidden sm:flex items-center gap-1">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-7 w-14 rounded border bg-background px-1 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="flex items-center gap-1 text-sm">
          <input
            type="number"
            value={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(Math.max(0, Math.min(page, pageCount - 1)));
            }}
            className="h-7 w-12 rounded border bg-background px-1 text-center text-sm"
            min={1}
            max={pageCount}
          />
          <span className="text-muted-foreground">of {pageCount || 1}</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface ResidueTableProps {
  data: ResidueWarning[];
  onFocus: (warning: ResidueWarning) => void;
  state: TableState;
  onStateChange: (state: TableState) => void;
}

function ResidueTable({ data, onFocus, state, onStateChange }: ResidueTableProps) {
  const columns = React.useMemo<ColumnDef<ResidueWarning>[]>(
    () => [
      {
        accessorKey: "chain_id",
        header: "Chain",
        size: 80,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as string} search={state.globalFilter} />
        ),
      },
      {
        accessorKey: "residue_id",
        header: "Residue ID",
        size: 100,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as number} search={state.globalFilter} />
        ),
      },
      {
        accessorKey: "residue_name",
        header: "Residue",
        size: 100,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as string} search={state.globalFilter} />
        ),
      },
      {
        accessorKey: "message",
        header: "Message",
        size: 300,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as string} search={state.globalFilter} />
        ),
      },
      {
        id: "actions",
        header: "",
        size: 60,
        cell: ({ row }) => (
          <button
            onClick={() => onFocus(row.original)}
            className="px-2 py-1 text-xs rounded hover:bg-muted transition-colors text-primary hover:underline"
          >
            Show
          </button>
        ),
      },
    ],
    [onFocus, state.globalFilter]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(state.sorting) : updater;
      onStateChange({ ...state, sorting: newSorting });
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(state.pagination) : updater;
      onStateChange({ ...state, pagination: newPagination });
    },
    onGlobalFilterChange: (updater) => {
      const newFilter = typeof updater === 'function' ? updater(state.globalFilter) : updater;
      onStateChange({ ...state, globalFilter: newFilter });
    },
    state: {
      sorting: state.sorting,
      pagination: state.pagination,
      globalFilter: state.globalFilter,
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            value={state.globalFilter ?? ""}
            onChange={(e) => onStateChange({ ...state, globalFilter: e.target.value })}
            className="w-full h-9 pl-8 pr-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
      </div>
      <div className="sticky top-0 z-10 bg-background border-b">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="bg-muted/50"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className={cn(
                          "flex items-center gap-1 hover:text-foreground transition-colors",
                          header.column.getCanSort() ? "cursor-pointer select-none" : ""
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        </Table>
      </div>
      <div className="flex-1 overflow-auto">
        <Table>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls table={table} />
    </div>
  );
}

interface InteractionTableProps {
  data: InteractionWarning[];
  onFocus: (warning: InteractionWarning) => void;
  state: TableState;
  onStateChange: (state: TableState) => void;
}

function InteractionTable({ data, onFocus, state, onStateChange }: InteractionTableProps) {
  const columns = React.useMemo<ColumnDef<InteractionWarning>[]>(
    () => [
      {
        accessorKey: "chain_id_1",
        header: "Chain 1",
        size: 80,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as string} search={state.globalFilter} />
        ),
      },
      {
        accessorKey: "residue_id_1",
        header: "Res. ID 1",
        size: 90,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as number} search={state.globalFilter} />
        ),
      },
      {
        accessorKey: "residue_name_1",
        header: "Res. 1",
        size: 80,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as string} search={state.globalFilter} />
        ),
      },
      {
        accessorKey: "chain_id_2",
        header: "Chain 2",
        size: 80,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as string} search={state.globalFilter} />
        ),
      },
      {
        accessorKey: "residue_id_2",
        header: "Res. ID 2",
        size: 90,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as number} search={state.globalFilter} />
        ),
      },
      {
        accessorKey: "residue_name_2",
        header: "Res. 2",
        size: 80,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as string} search={state.globalFilter} />
        ),
      },
      {
        accessorKey: "message",
        header: "Message",
        size: 250,
        cell: ({ getValue }) => (
          <HighlightText text={getValue() as string} search={state.globalFilter} />
        ),
      },
      {
        id: "actions",
        header: "",
        size: 60,
        cell: ({ row }) => (
          <button
            onClick={() => onFocus(row.original)}
            className="px-2 py-1 text-xs rounded hover:bg-muted transition-colors text-primary hover:underline"
          >
            Show
          </button>
        ),
      },
    ],
    [onFocus, state.globalFilter]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(state.sorting) : updater;
      onStateChange({ ...state, sorting: newSorting });
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(state.pagination) : updater;
      onStateChange({ ...state, pagination: newPagination });
    },
    onGlobalFilterChange: (updater) => {
      const newFilter = typeof updater === 'function' ? updater(state.globalFilter) : updater;
      onStateChange({ ...state, globalFilter: newFilter });
    },
    state: {
      sorting: state.sorting,
      pagination: state.pagination,
      globalFilter: state.globalFilter,
    },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            value={state.globalFilter ?? ""}
            onChange={(e) => onStateChange({ ...state, globalFilter: e.target.value })}
            className="w-full h-9 pl-8 pr-3 rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
      </div>
      <div className="sticky top-0 z-10 bg-background border-b">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="bg-muted/50"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className={cn(
                          "flex items-center gap-1 hover:text-foreground transition-colors",
                          header.column.getCanSort() ? "cursor-pointer select-none" : ""
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        </Table>
      </div>
      <div className="flex-1 overflow-auto">
        <Table>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls table={table} />
    </div>
  );
}

interface ResidueTabContentProps {
  title: string;
  noDataMessage: string;
  data: ResidueWarning[];
  onFocus: (warning: ResidueWarning) => void;
  state: TableState;
  onStateChange: (state: TableState) => void;
}

function ResidueTabContent({ noDataMessage, data, onFocus, state, onStateChange }: ResidueTabContentProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-md border h-[400px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{noDataMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border h-[400px]">
        <ResidueTable data={data} onFocus={onFocus} state={state} onStateChange={onStateChange} />
      </div>
      <p className="text-sm text-muted-foreground">
        Total: {data.length} log{data.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

interface InteractionTabContentProps {
  title: string;
  noDataMessage: string;
  data: InteractionWarning[];
  onFocus: (warning: InteractionWarning) => void;
  state: TableState;
  onStateChange: (state: TableState) => void;
}

function InteractionTabContent({ noDataMessage, data, onFocus, state, onStateChange }: InteractionTabContentProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-md border h-[400px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{noDataMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border h-[400px]">
        <InteractionTable data={data} onFocus={onFocus} state={state} onStateChange={onStateChange} />
      </div>
      <p className="text-sm text-muted-foreground">
        Total: {data.length} log{data.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

interface WarningsDialogProps {
  warnings: Warnings | undefined;
  isLoading?: boolean;
  onFocusResidue: (chainId: string, residueId: number, residueName: string) => void;
  onFocusInteraction: (
    chainId1: string,
    residueId1: number,
    residueName1: string,
    chainId2: string,
    residueId2: number,
    residueName2: string
  ) => void;
}

export function WarningsDialog({ warnings, isLoading, onFocusResidue, onFocusInteraction }: WarningsDialogProps) {
  const [open, setOpen] = React.useState(false);
  
  // Persisted state for all tables and tab selection
  const [persistedState, setPersistedState] = React.useState<PersistedState>(createDefaultPersistedState);

  // Track if we've done the initial tab selection
  const hasInitializedTab = React.useRef(false);

  // On first open, select the first tab that has warnings
  React.useEffect(() => {
    if (open && !hasInitializedTab.current && warnings) {
      hasInitializedTab.current = true;
      
      // Find the first tab with warnings
      if (warnings.repair.data.length > 0) {
        // Default is already "repair", no change needed
      } else if (warnings.optimisation.data.length > 0) {
        setPersistedState(prev => ({ ...prev, activeTab: "optimisation" }));
      } else if (warnings.interactions.data.length > 0) {
        setPersistedState(prev => ({ ...prev, activeTab: "interactions" }));
      }
    }
  }, [open, warnings]);

  // Helper to update a specific table's state
  const updateTableState = React.useCallback(
    (tableKey: keyof Pick<PersistedState, 'repairTable' | 'optimisationTable' | 'interactionsTable'>) => 
      (newState: TableState) => {
        setPersistedState(prev => ({ ...prev, [tableKey]: newState }));
      },
    []
  );

  const handleResidueFocus = React.useCallback(
    (warning: ResidueWarning) => {
      setOpen(false);
      onFocusResidue(warning.chain_id, warning.residue_id, warning.residue_name);
    },
    [onFocusResidue]
  );

  const handleInteractionFocus = React.useCallback(
    (warning: InteractionWarning) => {
      setOpen(false);
      onFocusInteraction(
        warning.chain_id_1,
        warning.residue_id_1,
        warning.residue_name_1,
        warning.chain_id_2,
        warning.residue_id_2,
        warning.residue_name_2
      );
    },
    [onFocusInteraction]
  );

  // Calculate total warnings
  const totalWarnings = warnings
    ? warnings.repair.data.length +
      warnings.optimisation.data.length +
      warnings.interactions.data.length
    : 0;

  if (!warnings || totalWarnings === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="lg"
          className="min-w-55 gap-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-2 border-amber-400 dark:border-amber-600"
        >
          View Logs
          <span className="ml-1 rounded-full bg-amber-500 text-white px-2 py-0.5 text-sm font-bold">
            {totalWarnings}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Optimisation logs
          </DialogTitle>
          <DialogDescription>
            Click column headers to sort.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={persistedState.activeTab} onValueChange={(value) => setPersistedState(prev => ({ ...prev, activeTab: value }))} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="repair" className="gap-2">
              Repair
              {warnings.repair.data.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs text-amber-800 dark:text-amber-200">
                  {warnings.repair.data.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="optimisation" className="gap-2">
              Optimisation
              {warnings.optimisation.data.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs text-amber-800 dark:text-amber-200">
                  {warnings.optimisation.data.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="interactions" className="gap-2">
              Interactions
              {warnings.interactions.data.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-xs text-amber-800 dark:text-amber-200">
                  {warnings.interactions.data.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="repair" className="mt-4">
            <ResidueTabContent
              title={warnings.repair.title}
              noDataMessage={warnings.repair.no_data_message}
              data={warnings.repair.data}
              onFocus={handleResidueFocus}
              state={persistedState.repairTable}
              onStateChange={updateTableState('repairTable')}
            />
          </TabsContent>
          <TabsContent value="optimisation" className="mt-4">
            <ResidueTabContent
              title={warnings.optimisation.title}
              noDataMessage={warnings.optimisation.no_data_message}
              data={warnings.optimisation.data}
              onFocus={handleResidueFocus}
              state={persistedState.optimisationTable}
              onStateChange={updateTableState('optimisationTable')}
            />
          </TabsContent>
          <TabsContent value="interactions" className="mt-4">
            <InteractionTabContent
              title={warnings.interactions.title}
              noDataMessage={warnings.interactions.no_data_message}
              data={warnings.interactions.data}
              onFocus={handleInteractionFocus}
              state={persistedState.interactionsTable}
              onStateChange={updateTableState('interactionsTable')}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
