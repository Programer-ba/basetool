import { Button, ButtonGroup } from "@chakra-ui/react";
import { PencilAltIcon, PlusIcon } from "@heroicons/react/outline";
import { columnsSelector } from "../state-slice";
import { humanize } from "@/lib/humanize";
import { useACLHelpers } from "@/features/authorization/hooks";
import { useAppSelector, useDataSourceContext } from "@/hooks";
import { useBoolean, useClickAway } from "react-use";
import { useDataSourceResponse } from "@/features/data-sources/hooks";
import { useViewResponse } from "@/features/views/hooks";
import BulkDeleteButton from "@/features/tables/components/BulkDeleteButton";
import CursorPagination from "@/features/tables/components/CursorPagination";
import FiltersButton from "@/features/tables/components/FiltersButton";
import FiltersPanel from "@/features/tables/components/FiltersPanel";
import Layout from "@/components/Layout";
import Link from "next/link";
import LoadingOverlay from "@/components/LoadingOverlay";
import OffsetPagination from "@/features/tables/components/OffsetPagination";
import PageWrapper from "@/components/PageWrapper";
import React, { memo, useMemo, useRef } from "react";
import RecordsTable from "@/features/tables/components/RecordsTable";

const RecordsIndexPage = ({
  error,
  isFetching,
}: {
  error?: string;
  isFetching?: boolean;
}) => {
  const { viewId, tableName, dataSourceId, newRecordPath } =
    useDataSourceContext();
  const { view } = useViewResponse(viewId);
  const { info } = useDataSourceResponse(dataSourceId);

  const filtersButton = useRef(null);
  const filtersPanel = useRef(null);

  useClickAway(filtersPanel, (e) => {
    // When a user click the filters button to close the filters panel, the button is still outside,
    // so the action triggers twice closing and opening the filters panel.
    if (
      filtersButton?.current &&
      !(filtersButton?.current as any)?.contains(e.target)
    ) {
      toggleFiltersPanelVisible(false);
    }
  });

  // We need to find out if it has Id column for the visibility of delete bulk and create buttons (footer).
  const rawColumns = useAppSelector(columnsSelector);
  const hasIdColumn = useMemo(
    () => rawColumns.find((col) => col.name === "id"),
    [rawColumns]
  );

  const headingText = useMemo(() => {
    if (view) {
      return view.name;
    } else if (tableName) {
      return humanize(tableName);
    } else {
      return "Browse records";
    }
  }, [view, tableName]);

  const [filtersPanelVisible, toggleFiltersPanelVisible] = useBoolean(false);

  const PaginationComponent = useMemo(() => {
    switch (info?.pagination) {
      default:
      case "offset":
        return OffsetPagination;
      case "cursor":
        return CursorPagination;
    }
  }, [info?.pagination]);

  const { canBulkDelete, canCreate, canCreateView, canEditView } =
    useACLHelpers({ dataSourceInfo: info, viewId });

  const CreateButton = () => {
    if (!newRecordPath) return null;

    return (
      <Link href={newRecordPath} passHref>
        <Button
          as="a"
          colorScheme="blue"
          size="sm"
          width="300px"
          leftIcon={<PlusIcon className="h-4" />}
        >
          Create record
        </Button>
      </Link>
    );
  };

  const CreateViewButton = () => (
    <Link
      href={`/views/new?dataSourceId=${dataSourceId}&tableName=${tableName}`}
      passHref
    >
      <Button
        as="a"
        colorScheme="blue"
        variant="ghost"
        leftIcon={<PlusIcon className="h-4" />}
      >
        Create view from this table
      </Button>
    </Link>
  );

  const EditViewButton = () => (
    <Link href={`/views/${viewId}/edit`} passHref>
      <Button
        as="a"
        colorScheme="blue"
        variant="ghost"
        leftIcon={<PencilAltIcon className="h-4" />}
      >
        Edit view
      </Button>
    </Link>
  );

  return (
    <Layout>
      <PageWrapper
        heading={headingText}
        flush={true}
        buttons={
          <ButtonGroup size="xs">
            {canCreateView && <CreateViewButton />}
            {canEditView && <EditViewButton />}
          </ButtonGroup>
        }
        footer={
          hasIdColumn && (
            <PageWrapper.Footer
              left={canBulkDelete && <BulkDeleteButton />}
              center={canCreate && <CreateButton />}
            />
          )
        }
      >
        <div className="relative flex flex-col flex-1 w-full h-full">
          <div className="relative flex justify-end w-full py-2 px-2 bg-white shadow z-20 rounded">
            {filtersPanelVisible && <FiltersPanel ref={filtersPanel} />}
            <div className="flex flex-shrink-0">
              {info?.supports?.filters && (
                <FiltersButton
                  filtersButtonRef={filtersButton}
                  toggleFiltersPanelVisible={toggleFiltersPanelVisible}
                />
              )}
            </div>
          </div>
          <div className="relative flex-1 flex h-full max-w-full w-full">
            {dataSourceId && (
              <div className="flex-1 flex flex-col justify-between w-full">
                {isFetching && (
                  <div className="flex-1 flex">
                    <LoadingOverlay label="Fetching records" transparent />
                  </div>
                )}
                {!isFetching && (
                  <>
                    <div className="flex-1 flex overflow-x-auto w-full">
                      <RecordsTable error={error} />
                    </div>
                    <PaginationComponent />
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </Layout>
  );
};

export default memo(RecordsIndexPage);
