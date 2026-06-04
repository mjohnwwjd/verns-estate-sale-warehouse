tell application "Photos"
  set albumNames to {}
  repeat with oneAlbum in every album
    copy name of oneAlbum to end of albumNames
  end repeat
end tell

return albumNames
