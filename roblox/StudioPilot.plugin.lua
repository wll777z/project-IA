-- StudioPilot 0.1: recebe mensagens do navegador; NAO executa codigo.
local HttpService = game:GetService("HttpService")
local toolbar = plugin:CreateToolbar("StudioPilot")
local button = toolbar:CreateButton("StudioPilot", "Abrir conexão local", "")
local info = DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 360, 260, 300, 220)
local widget = plugin:CreateDockWidgetPluginGuiAsync("StudioPilotBridge01", info)
widget.Title = "StudioPilot"
local frame = Instance.new("Frame")
frame.Size = UDim2.fromScale(1, 1)
frame.BackgroundColor3 = Color3.fromRGB(25, 29, 44)
frame.Parent = widget
local function make(class, y, h, content)
    local obj = Instance.new(class)
    obj.Position = UDim2.new(0, 10, 0, y)
    obj.Size = UDim2.new(1, -20, 0, h)
    if class == "TextLabel" then
        obj.BackgroundTransparency = 1
        obj.TextColor3 = Color3.new(1, 1, 1)
        obj.TextWrapped = true
    else
        obj.BackgroundColor3 = Color3.fromRGB(88, 89, 146)
    end
    obj.Text = content
    obj.Parent = frame
    return obj
end
make("TextLabel", 8, 38, "Cole o token do terminal Python:")
local token = make("TextBox", 50, 36, "")
token.PlaceholderText = "Token local"
token.ClearTextOnFocus = false
local connect = make("TextButton", 96, 36, "Conectar")
local status = make("TextLabel", 145, 96, "Desconectado. Nenhum código será executado.")
local active = false
button.Click:Connect(function() widget.Enabled = not widget.Enabled end)
connect.MouseButton1Click:Connect(function()
    if active then
        active = false
        connect.Text = "Conectar"
        status.Text = "Desconectado."
    elseif #token.Text >= 16 then
        active = true
        connect.Text = "Desconectar"
        status.Text = "Conectando..."
    else
        status.Text = "Cole o token do servidor."
    end
end)
task.spawn(function()
    while true do
        if active then
            local ok, response = pcall(function()
                return HttpService:RequestAsync({
                    Url = "http://127.0.0.1:8765/api/poll",
                    Method = "GET",
                    Headers = { ["X-StudioPilot-Token"] = token.Text }
                })
            end)
            if ok and response.Success then
                local parsed, data = pcall(function() return HttpService:JSONDecode(response.Body) end)
                if parsed and type(data.messages) == "table" then
                    status.Text = "Conectado. Aguardando mensagens..."
                    for _, item in ipairs(data.messages) do
                        status.Text = "Mensagem #" .. tostring(item.id) .. ": " .. tostring(item.message):sub(1, 160)
                        print("[StudioPilot] #" .. tostring(item.id) .. " " .. tostring(item.message))
                    end
                end
            else
                status.Text = "Falha na conexão. Verifique o token, o servidor e a permissão HTTP."
            end
        end
        task.wait(2)
    end
end)
