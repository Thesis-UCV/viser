import { ViewerContext } from "../ViewerContext";
import {
  Box,
  Button,
  Image,
  Checkbox,
  Divider,
  Group,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconHomeMove, IconPhoto } from "@tabler/icons-react";
import { Stats } from "@react-three/drei";
import React from "react";
import SceneTreeTable from "./SceneTreeTable";

const MemoizedTable = React.memo(SceneTreeTable);

export default function ServerControls() {
  const viewer = React.useContext(ViewerContext)!;
  const viewerMutable = viewer.mutable.current; // Get mutable once
  const [showStats, setShowStats] = React.useState(false);
  const controlWidth = viewer.useGui((state) => state.theme.control_width);

  return (
    <>
      {showStats ? <Stats className="stats-panel" /> : null}
      <Stack gap="xs" mt="0.3em">
        <Tooltip label="URL del Servidor" position="top-start">
          <TextInput
            leftSection={
              <Image
                src="./logo.svg"
                style={{
                  width: "1rem",
                  height: "auto",
                  filter: "grayscale(100%) opacity(0.3)",
                }}
              />
            }
            leftSectionWidth="1.8rem"
            defaultValue={viewer.useGui((state) => state.server)}
            onBlur={(event) =>
              viewer.useGui.setState({ server: event.currentTarget.value })
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
                event.currentTarget.focus();
              }
            }}
          />
        </Tooltip>
        <Group gap="0.5em">
          <Button
            onClick={async () => {
              const supportsFileSystemAccess =
                "showSaveFilePicker" in window &&
                (() => {
                  try {
                    return window.self === window.top;
                  } catch {
                    return false;
                  }
                })();

              if (supportsFileSystemAccess) {
                // File System Access API is supported. (eg Chrome)
                const fileHandlePromise = window.showSaveFilePicker({
                  suggestedName: "render.png",
                  types: [
                    {
                      accept: { "image/png": [".png"] },
                    },
                  ],
                });
                viewerMutable.canvas?.toBlob(async (blob) => {
                  if (blob === null) {
                    console.error("Export failed");
                    return;
                  }

                  const handle = await fileHandlePromise;
                  const writableStream = await handle.createWritable();
                  await writableStream.write(blob);
                  await writableStream.close();
                });
              } else {
                // File System Access API is not supported. (eg Firefox)
                viewerMutable.canvas?.toBlob((blob) => {
                  if (blob === null) {
                    console.error("Export failed");
                    return;
                  }
                  const href = URL.createObjectURL(blob);

                  // Download a file by creating a link and then clicking it.
                  const link = document.createElement("a");
                  link.href = href;
                  const filename = "render.png";
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(href);
                });
              }
            }}
            flex={1}
            leftSection={
              controlWidth === "small" ? undefined : <IconPhoto size="1rem" />
            }
            px="0"
            style={{ height: "1.875rem" }}
          >
            Guardar Lienzo
          </Button>
          <Button
            onClick={() => {
              viewerMutable.resetCameraView!();
            }}
            flex={1}
            leftSection={
              controlWidth === "small" ? undefined : (
                <IconHomeMove size="1rem" />
              )
            }
            px="0"
            style={{ height: "1.875rem" }}
          >
            Restablecer Vista
          </Button>
        </Group>
        <Group gap="md">
          <Tooltip
            label={
              <>
                Herramienta para establecer el punto de
                <br />
                enfoque y la dirección vertical de la cámara.
                <br />
                <br />
                Se puede usar para definir el origen de los
                <br />
                controles de órbita.
              </>
            }
            refProp="rootRef"
            position="top-start"
          >
            <Checkbox
              radius="xs"
              label="Herramienta de Órbita"
              onChange={(event) => {
                viewer.useGui.setState({
                  showOrbitOriginTool: event.currentTarget.checked,
                });
              }}
              styles={{
                label: { paddingLeft: "8px", letterSpacing: "-0.3px" },
                root: { flex: 1 },
              }}
              size="sm"
            />
          </Tooltip>
          <Tooltip
            label={"Mostrar estadísticas WebGL."}
            refProp="rootRef"
            position="top-start"
          >
            <Checkbox
              radius="xs"
              label="Estadísticas WebGL"
              onChange={(event) => {
                setShowStats(event.currentTarget.checked);
              }}
              styles={{
                label: { paddingLeft: "8px", letterSpacing: "-0.3px" },
                root: { flex: 1 },
              }}
              size="sm"
            />
          </Tooltip>
        </Group>
        <Divider mt="xs" />
        <Box>
          <Tooltip
            label={
              <>
                Vista jerárquica de todos los objetos en la escena 3D.
                <br />
                Permite modificar visibilidad y propiedades.
              </>
            }
            position="top-start"
          >
            <Text style={{ fontWeight: 500 }} fz="sm">
              Árbol de Escena
            </Text>
          </Tooltip>
          <MemoizedTable />
        </Box>
      </Stack>
    </>
  );
}
