import React, { useState, useRef } from "react";
import { Stage, Layer, Image, Rect, Text } from "react-konva";
import { Canvas } from "@react-three/fiber";
import { Box, OrbitControls } from "@react-three/drei";

const App = () => {
  const [rectangles, setRectangles] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef(null);

  const [rectSize, setRectSize] = useState({ width: 50, height: 50 });
  const [label, setLabel] = useState("car");
  const [image, setImage] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 400,
    height: 300,
  });

  const [viewMode, setViewMode] = useState("2D");
  const [threeDBoxes, setThreeDBoxes] = useState([
    // 3D bounding boxes
    {
      position: [0, 0, 0],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      label: "car",
      confidence: 0.95,
    },
  ]);

  // Handle file input
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target.result;
        img.onload = () => {
          setImage(img);
          setImageDimensions({ width: img.width, height: img.height });
          setIsImageLoaded(true);
          // Simulate AI on upload
          generateAiSuggestions();
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulate AI model for suggestions
  const generateAiSuggestions = () => {
    const suggestions = [];
    for (let i = 0; i < 3; i++) {
      suggestions.push({
        id: Date.now() + i,
        x: Math.random() * 300,
        y: Math.random() * 200,
        width: Math.random() * 100 + 50,
        height: Math.random() * 100 + 50,
        label: ["car", "pedestrian", "lane"][Math.floor(Math.random() * 3)],
        confidence: Math.random() * 0.5 + 0.5,
      });
    }
    setAiSuggestions(suggestions);
  };

  const handleDragStart = (e) => {
    const node = e.target;
    if (node && node.attrs && node.attrs.id) {
      setSelectedId(node.attrs.id);
    } else {
      console.warn("Drag start target has no valid id:", node);
      setSelectedId(null);
    }
  };

  const handleDragEnd = (e) => {
    const node = e.target;
    if (node && node.attrs && node.attrs.id) {
      const id = node.attrs.id;
      const { x, y } = node.attrs;
      setRectangles(
        rectangles.map((rect) => (rect.id === id ? { ...rect, x, y } : rect))
      );
      setSelectedId(null);
    }
  };

  const handleStageClick = (e) => {
    if (!selectedId) {
      const stage = stageRef.current;
      const pos = stage.getPointerPosition();
      const clickedRect = stage.getIntersection(pos);
      if (!clickedRect || (image && !clickedRect.attrs.id)) {
        setRectangles([
          ...rectangles,
          {
            id: Date.now().toString(),
            x: pos.x,
            y: pos.y,
            width: rectSize.width,
            height: rectSize.height,
            label,
          },
        ]);
      }
    }
  };

  const handleSave = () => {
    const allAnnotations = [
      ...rectangles,
      ...aiSuggestions.filter((s) => s.confidence > 0.9),
    ];
    console.log("Saved Annotations:", allAnnotations);
  };

  const handleWidthChange = (e) => {
    const width = parseInt(e.target.value, 10) || 50;
    setRectSize((prev) => ({ ...prev, width: width > 400 ? 400 : width }));
  };

  const handleHeightChange = (e) => {
    const height = parseInt(e.target.value, 10) || 50;
    setRectSize((prev) => ({ ...prev, height: height > 300 ? 300 : height }));
  };

  const handleLabelChange = (e) => {
    setLabel(e.target.value);
  };

  const scaleX = image ? 400 / imageDimensions.width : 1;
  const scaleY = image ? 300 / imageDimensions.height : 1;
  const scale = Math.min(scaleX, scaleY);

  const ThreeDScene = () => {
    return (
      <Canvas style={{ width: 400, height: 300 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {threeDBoxes.map((box, i) => (
          <Box
            key={i}
            position={box.position}
            scale={box.scale}
            rotation={box.rotation}
            material-color="blue"
          >
            <meshStandardMaterial color="blue" wireframe />
          </Box>
        ))}
        <mesh position={[0, -1, 0]} scale={[5, 0.1, 5]}>
          <boxGeometry />
          <meshStandardMaterial color="gray" />
        </mesh>
      </Canvas>
    );
  };

  return (
    <div>
      <h4>Annotation Tool for ADAS</h4>
      <button onClick={() => setViewMode(viewMode === "2D" ? "3D" : "2D")}>
        Switch to {viewMode === "2D" ? "3D" : "2D"}
      </button>
      {viewMode === "2D" ? (
        <>
          <div>
            <label>Upload Image: </label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <label> Width: </label>
            <input
              type="number"
              value={rectSize.width}
              onChange={handleWidthChange}
              min="10"
              max="400"
            />
            <label> Height: </label>
            <input
              type="number"
              value={rectSize.height}
              onChange={handleHeightChange}
              min="10"
              max="300"
            />
            <label> Label: </label>
            <select value={label} onChange={handleLabelChange}>
              <option value="car">Car</option>
              <option value="truck">Truck</option>
              <option value="pedestrian">Pedestrian</option>
              <option value="lane">Lane</option>
              <option value="traffic sign">Traffic Sign</option>
            </select>
          </div>
          <button onClick={generateAiSuggestions}>
            Generate AI Suggestions
          </button>
          <button onClick={handleSave}>Save to Backend</button>
          <Stage
            width={400}
            height={300}
            onClick={handleStageClick}
            ref={stageRef}
          >
            <Layer>
              {isImageLoaded && (
                <Image
                  image={image}
                  scaleX={scale}
                  scaleY={scale}
                  x={(400 - imageDimensions.width * scale) / 2}
                  y={(300 - imageDimensions.height * scale) / 2}
                />
              )}
              {!isImageLoaded && (
                <Rect x={0} y={0} width={400} height={300} fill="lightgray" />
              )}
              {aiSuggestions.map((rect) => (
                <React.Fragment key={rect.id}>
                  <Rect
                    id={rect.id.toString()}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill="transparent"
                    stroke="green"
                    strokeWidth={2}
                    dash={[10, 5]}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                  <Text
                    text={`${rect.label} (${Math.round(
                      rect.confidence * 100
                    )}%)`}
                    x={rect.x}
                    y={rect.y - 10}
                    fontSize={14}
                    fill="green"
                    align="center"
                    width={rect.width}
                  />
                </React.Fragment>
              ))}
              {rectangles.map((rect) => (
                <React.Fragment key={rect.id}>
                  <Rect
                    id={rect.id}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill="transparent"
                    stroke="red"
                    strokeWidth={2}
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    shadowEnabled={rect.id === selectedId}
                    shadowBlur={10}
                    shadowOpacity={0.5}
                  />
                  <Text
                    text={rect.label}
                    x={rect.x}
                    y={rect.y - 10}
                    fontSize={14}
                    fill="red"
                    align="center"
                    width={rect.width}
                  />
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        </>
      ) : (
        <ThreeDScene />
      )}
      <p>
        {viewMode === "2D"
          ? "Green: AI Suggestions | Red: Manual Annotations"
          : "3D Bounding Boxes (Blue Wireframe)"}
      </p>
    </div>
  );
};

export default App;
