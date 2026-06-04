on run argv
  set exportPath to item 1 of argv
  set exportFolder to POSIX file exportPath

  tell application "Photos"
    set recentItems to media items of last import album
    set itemCount to count of recentItems
    if itemCount is greater than 50 then
      set recentItems to items 1 thru 50 of recentItems
      set itemCount to 50
    end if
    if itemCount is greater than 0 then
      export recentItems to exportFolder with using originals
    end if
  end tell

  return itemCount as text
end run
